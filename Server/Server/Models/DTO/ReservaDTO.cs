﻿namespace Server.Models.DTO
{
    public class ReservaDTO
    {

        public DetailReservaDTO detailReserva { get; set; }
        public int idUsuario { get; set; }
        public int idCliente { get; set; }
        public string estatus { get; set; }
    }
}
