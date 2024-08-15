import { Component, computed, effect, inject, signal } from '@angular/core';
import { InventarioPostresService } from './service/inventario-postres.service';
import { BehaviorSubject, combineLatest, combineLatestWith, map, Observable, of } from 'rxjs';
import { InventarioPostre } from './interface/InventarioPostres';
import { FormsModule, NgForm } from '@angular/forms';
import { HlmDialogComponent, HlmDialogContentComponent, HlmDialogDescriptionDirective, HlmDialogFooterComponent, HlmDialogHeaderComponent, HlmDialogTitleDirective } from '~/components/ui-dialog-helm/src';
import { AsyncPipe, CommonModule } from '@angular/common';
import { BrnDialogContentDirective, BrnDialogTriggerDirective } from '@spartan-ng/ui-dialog-brain';
import { HlmButtonDirective } from '~/components/ui-button-helm/src';
import { HlmInputDirective } from '~/components/ui-input-helm/src';
import { BrnTableModule, PaginatorState, useBrnColumnManager } from '@spartan-ng/ui-table-brain';
import { HlmTableModule } from '@spartan-ng/ui-table-helm';
import { BrnMenuTriggerDirective } from '@spartan-ng/ui-menu-brain';
import { HlmMenuModule } from '@spartan-ng/ui-menu-helm';
import { provideIcons } from '@ng-icons/core';
import { lucideMoreHorizontal } from '@ng-icons/lucide';
import { HlmIconComponent } from '~/components/ui-icon-helm/src';
import { HlmSelectContentDirective, HlmSelectOptionComponent, HlmSelectTriggerComponent, HlmSelectValueDirective } from '~/components/ui-select-helm/src';
import { BrnSelectImports } from '@spartan-ng/ui-select-brain';

@Component({
  selector: 'app-inventario-postres',
  standalone: true,
  imports: [
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogHeaderComponent,
    HlmDialogFooterComponent,
    HlmButtonDirective,
    HlmInputDirective,
    HlmDialogTitleDirective,
    HlmDialogDescriptionDirective,
    HlmIconComponent,
    HlmSelectTriggerComponent,
    HlmSelectValueDirective,
    HlmSelectContentDirective,
    HlmSelectOptionComponent,
    BrnDialogTriggerDirective,
    BrnDialogContentDirective,
    BrnTableModule,
    BrnSelectImports,
    FormsModule,
    CommonModule,
    AsyncPipe,
    BrnTableModule,
    HlmTableModule,
    BrnMenuTriggerDirective,
    HlmMenuModule,
  ],
  templateUrl: './inventario-postres.component.html',
  styleUrls: ['./inventario-postres.component.css'],
  providers: [
    provideIcons({
      lucideMoreHorizontal,
    }),
  ],
})
export class InventarioPostresComponent {
  inventarioPostresService = inject(InventarioPostresService);
  private inventarioPostresSource$: Observable<InventarioPostre[]>;
  inventarioPostres$: Observable<InventarioPostre[]>;
  inventarioPostre: InventarioPostre = {};
  editMode: boolean = false;
  private filterSubject = new BehaviorSubject<string>('');
  filter$ = this.filterSubject.asObservable();

  // Column manager
  protected readonly _brnColumnManager = useBrnColumnManager({
    ID: {visible: true, label: 'ID', sortable: true},
    Producto: {visible: true, label: 'Producto', sortable: true},
    Cantidad: {visible: true, label: 'Cantidad', sortable: true},
  });

  // Columnas visibles
  protected readonly displayedColumns = computed(() => [
    ...this._brnColumnManager.displayedColumns(),
    'actions',
  ]);

  // Paginación
  private readonly _displayedIndices = signal({ start: 0, end: 0 });
  protected readonly _availablePageSizes = [5, 10, 20, 10000];
  protected readonly _pageSize = signal(this._availablePageSizes[0]);
  protected readonly _totalElements = signal(0);

  constructor() {
    this.inventarioPostresSource$ = this.inventarioPostresService.getInventarioPostre().pipe(
      map((inventarioPostres) => inventarioPostres.filter((inventarioPostre) => inventarioPostre.estatus === 1))
    );

    this.inventarioPostres$ = combineLatest([
      this.inventarioPostresSource$,
      this.filter$
    ]).pipe(
      map(([inventarioPostres, filterValue]) => 
        inventarioPostres.filter(inventarioPostre => 
          inventarioPostre.idProducto?.toString().includes(filterValue.toLowerCase()) ?? false
        )
      ),
      map(filteredInventarioPostres => {
        this._totalElements.set(filteredInventarioPostres.length);
        const start = this._displayedIndices().start;
        const end = this._displayedIndices().end + 1;
        return filteredInventarioPostres.slice(start, end);
      })
    );
  }

  private _updatePaginatedData() {
    this.inventarioPostresSource$.pipe(
      combineLatestWith(this.filter$),
      map(([inventarioPostres, filterValue]) => {
        // Filtrar los registros
        const filteredInventarioPostres = inventarioPostres.filter(inventarioPostre =>
          inventarioPostre.idProducto?.toString().includes(filterValue.toLowerCase()) ?? false
        );
  
        // Obtener los índices de paginación
        const start = this._displayedIndices().start;
        const end = this._displayedIndices().end + 1;
  
        // Actualizar la cantidad total de elementos
        this._totalElements.set(filteredInventarioPostres.length);
  
        // Retornar el subconjunto de datos basado en la paginación
        return filteredInventarioPostres.slice(start, end);
      })
    ).subscribe(paginatedInventarioPostres => {
      this.inventarioPostres$ = of(paginatedInventarioPostres);
    });
  }

  protected readonly _onStateChange = ({ startIndex, endIndex }: PaginatorState) => {
    this._displayedIndices.set({ start: startIndex, end: endIndex });
    this._updatePaginatedData();
  };

  trackByInventarioPostreId(index: number, inventarioPostre: any): number {
    return inventarioPostre.idPostre;
  }

  trackByColumnName(index: number, column: any): string {
    return column.name;
  }

  applyFilter(filterValue: string) {
    this.filterSubject.next(filterValue);
  }

  applyFilterFromEvent(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.applyFilter(inputElement.value);
  }

  onSubmitAdd(form: NgForm) {
    if (form.valid) {
      this.inventarioPostre.estatus = 1;
      this.inventarioPostre.createdAt = new Date().toISOString();
      this.inventarioPostresService.registrarInventarioPostre(this.inventarioPostre).subscribe((response) => {
        console.log('Inventario de postre registrado:', response);
        form.resetForm();
        this.inventarioPostre = {}; // Reiniciar el objeto inventario de postre
        this.refreshInventarioPostres();
      });
    }
  }

  onSubmitEdit(form: NgForm) {
    if (form.valid) {
      this.inventarioPostresService.editarInventarioPostre(this.inventarioPostre.idPostre!, this.inventarioPostre).subscribe((response) => {
        console.log('Inventario de postre actualizado:', response);
        form.resetForm();
        this.inventarioPostre = {}; // Reiniciar el objeto inventario de postre
        this.editMode = false;
        this.refreshInventarioPostres();
      });
    }
  }

  onAdd() {
    this.inventarioPostre = {}; // Limpiar el objeto inventario de postre antes de abrir el formulario de agregar
    const addButton = document.getElementById('add-inventario-trigger');
    addButton?.click();
  }

  onEdit(inventarioPostre: InventarioPostre) {
    this.inventarioPostre = { ...inventarioPostre };
    this.editMode = true;
    const editButton = document.getElementById('edit-inventario-trigger');
    editButton?.click();
  }

  onDelete(id: number) {
    this.inventarioPostresService.eliminarInventarioPostre(id).subscribe(() => {
      console.log('Inventario de postre eliminado');
      this.refreshInventarioPostres();
    });
  }

  refreshInventarioPostres() {
    this.inventarioPostres$ = this.inventarioPostresService.getInventarioPostre().pipe(
      map((inventarioPostres) =>
        inventarioPostres.filter((inventarioPostre) => inventarioPostre.estatus === 1)
      )
    );
  }
}
