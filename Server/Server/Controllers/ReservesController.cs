﻿using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.lib;
using Server.Models;
using Server.Models.DTO;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReservesController : ControllerBase
    {
        private readonly Context _context;
        private readonly CreditCardService _creditCardService;

        public ReservesController(Context context, CreditCardService creditService)
        {
            _context = context;
            _creditCardService = creditService;
        }

        // GET: api/Reserves
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Reserva>>> GetReserves()
        {
            var ReservacionesActivas = await _context.Reservas
                .Include(r => r.DetailReserva)
                .Include(r => r.Usuario) 
                .ToListAsync();

            return Ok(ReservacionesActivas);
        }

        // GET: api/Reserves/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Reserva>> GetReserva(int id)
        {
            var reserva = await _context.Reservas
                .Include(r => r.DetailReserva)
                .Include(r => r.Usuario)

                .FirstOrDefaultAsync(r => r.idReserva == id);

            if (reserva == null)
            {
                return NotFound();
            }

            return Ok(reserva);
        }

        // GET: api/Reserves/bySpace/1
        [HttpGet("bySpace/{idEspacio}")]
        public async Task<ActionResult<IEnumerable<Reserva>>> GetReservasByEspacio(int idEspacio)
        {
            var reservas = await _context.Reservas
                .Where(r => r.DetailReserva.idEspacio == idEspacio)
                .Where(r => r.estatus == "Pagado" || r.estatus == "Pendiente" || r.estatus == "Activo")
                .Include(r => r.DetailReserva) // Incluir detalles de la reserva
                .Include(r => r.Usuario) // Incluir usuario de la reserva
                .ToListAsync();

            if (reservas == null || !reservas.Any())
            {
                return NotFound();
            }

            return Ok(reservas);
        }
        [HttpPost]
        public async Task<ActionResult<Reserva>> PostReserva([FromBody] ReservaDTO reservaDTO)
        {
            if (reservaDTO == null)
            {
                return BadRequest("ReservaDTO is null.");
            }

            // Verificar existencia de usuario y cliente
            var clienteExists = await _context.Users.FindAsync(reservaDTO.idCliente);
            var espacioExists = await _context.Espacios.FindAsync(reservaDTO.detailReserva.idEspacio);

            if (clienteExists == null)
            {
                return BadRequest("User or client does not exist.");
            }

            if (espacioExists == null)
            {
                return BadRequest("Espacio does not exist.");
            }

            if (reservaDTO.creditCard != null)
            {
                if (reservaDTO == null)
                {
                    return BadRequest("ReservaDTO is null.");
                }

                if (reservaDTO.detailReserva == null)
                {
                    return BadRequest("El detalle de la reserva no puede ser nulo");
                }

                var espacio = _context.Espacios.Find(reservaDTO.detailReserva.idEspacio);

                decimal amountPlace = (decimal)espacio.precio;

                if (amountPlace == 0)
                {
                    return BadRequest("El espacio no tiene precio");
                }

                var result = _creditCardService.canPay(reservaDTO.creditCard, amountPlace);
                Console.WriteLine(result);
                if (result != "La tarjeta es válida")
                {
                    return BadRequest(result);
                }

                reservaDTO.estatus = "Pagado";
            }
            else
            {
                reservaDTO.estatus = "Pendiente";
            }

            // Crear el detalle de la reserva
            var detailReserva = new DetailReserva
            {
                fecha = reservaDTO.detailReserva.fecha,
                horaInicio = reservaDTO.detailReserva.horaInicio,
                horaFin = reservaDTO.detailReserva.horaFin,
                idEspacio = reservaDTO.detailReserva.idEspacio
            };

            // Añadir el detalle de la reserva al contexto y guardar
            _context.DetailReservas.Add(detailReserva);
            await _context.SaveChangesAsync();

            // Crear la reserva
            var reserva = new Reserva
            {
                idDetailReser = detailReserva.idDetailReser,
                idCliente = reservaDTO.idCliente,
                estatus = reservaDTO.estatus,
                DetailReserva = detailReserva,
                Usuario = clienteExists
            };

            // Añadir la reserva al contexto y guardar
            _context.Reservas.Add(reserva);
            await _context.SaveChangesAsync();



            using (HttpClient client = new HttpClient())
            {
                var data = new Dictionary<string, string?>
            {
                { "id", reserva.idReserva.ToString() },
                { "ticket", "0"},
            };

                var content = new FormUrlEncodedContent(data);

                Console.WriteLine($"Se genero el QR, {data["id"]}, {data["ticket"]}");

                HttpResponseMessage response = await client.PostAsync("http://localhost:5000/generate_qr_reservation", content);

                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine(response.Content);
                }
                else
                {
                    Console.WriteLine(response.Content);
                    return NotFound($"Error con el QR, status: {response.StatusCode}");
                }
            }


            return CreatedAtAction("GetReserva", new { id = reserva.idReserva }, reserva);
        }



        // PUT: api/Reserves/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutReserva(int id, Reserva updatedReserva)
        {
            if (id != updatedReserva.idReserva)
            {
                return BadRequest();
            }

            var reserva = await _context.Reservas.FindAsync(id);
            if (reserva == null)
            {
                return NotFound();
            }

            reserva.idDetailReser = updatedReserva.idDetailReser;
            reserva.idCliente = updatedReserva.idCliente;
            reserva.estatus = updatedReserva.estatus;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ReservaExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Reserves/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReserva(int id)
        {
            //canbiar el estatus a cancelado
            var reserva = await _context.Reservas.FindAsync(id);
            if (reserva == null)
            {
                return NotFound();
            }

            reserva.estatus = "Cancelado";


            await _context.SaveChangesAsync();



            return NoContent();
        }

        [HttpPut("estatus/{id}")]
        public async Task<IActionResult> EstatusReserva(int id, [FromBody] string estatus)
        {

            Console.WriteLine(estatus);
            // Cambiar el estatus a cancelado
            var reserva = await _context.Reservas.FindAsync(id);
            if (reserva == null)
            {
                return NotFound();
            }

            reserva.estatus = estatus;

            await _context.SaveChangesAsync();

            return NoContent();
        }







        // GET: api/Reserves/byClient/1
        [HttpGet("byClient/{idCliente}")]
        public async Task<ActionResult<IEnumerable<Reserva>>> GetReservasByCliente(int idCliente)
        {
            var reservas = await _context.Reservas
                .Where(r => r.idCliente == idCliente)
                .Where(r => r.estatus == "Pagado" || r.estatus == "Cancelado" || r.estatus == "Finalizada")
                .Include(r => r.DetailReserva) // Incluir detalles de la reserva
                .Include(r => r.Usuario) // Incluir usuario de la reserva
                .ToListAsync();

            if (reservas == null || !reservas.Any())
            {
                return NotFound();
            }

            return Ok(reservas);
        }


        private bool ReservaExists(int id)
        {
            return _context.Reservas.Any(e => e.idReserva == id);
        }
    }
}
