import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NotificationComponent } from '../shared/notification/notification.component';
import { LoaderComponent } from '../shared/loader/loader.component';
import { CommonModule } from '@angular/common';
import { ConstantsService } from '../../services/constants.service';
import { PaginationComponent } from '../shared/pagination/pagination.component';
import { HttpService } from '../../services/http-service.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    NotificationComponent,
    LoaderComponent,
    FormsModule,
    CommonModule,
    PaginationComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent implements OnInit {
  showNotification: boolean = false;
  isLoading: boolean = false;
  showInventoryForm: boolean = false;
  showFormInUpdateMode: boolean = false;
  showAddDispatchForm: boolean = false;
  showAddDispatchForminAddMode: boolean = true;
  inventoryItems: any = [];
  notificationParams: any = {};
  selectedFile: File | undefined;
  itemHistory: any = [];
  showHistory: boolean = false;

  historyFilter: any = {
    pagination: {
      page: 1,
      pageSize: 5,
      dataCount: 5,
    },
  };

  quantityUnitType = [
    { id: 0, text: 'Unit' },
    { id: 1, text: 'ML' },
  ];
  itemType = [
    { id: 0, text: 'Unit' },
    { id: 1, text: 'ML' },
  ];
  filter: any = {
    searchText: '',
    filterObj: {
      itemType: '',
      stockType: 0
    },
    pagination: {
      page: 1,
      pageSize: 5,
      dataCount: 5,
    },
  };

  constService: ConstantsService;
  constructor(
    constService: ConstantsService,
    private httpService: HttpService
  ) {
    this.constService = constService;
  }
  ngOnInit(): void {
    this.fetchInventoryItems();
  }

  inventoryRequest = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl(''),
    itemType: new FormControl(0, Validators.required),
    quantityUnitType: new FormControl(0, Validators.required),
    pricePerUnit: new FormControl('', Validators.required),
    availableUnit: new FormControl(0),
    minUnitToShowAlert: new FormControl(0),
    file: new FormControl('')
  });

  selectedInventoryItem: any = {};

  addDispatchForm = new FormGroup({
    numberOfItems: new FormControl(1, [Validators.min(1)]),
    description: new FormControl(''),
  });

  fetchInventoryItems() {
    this.isLoading = true;
    let searchRequest: any = {};
    if (this.filter.searchText != null) {
      searchRequest.name = { $regex: this.filter.searchText, $options: 'i' };
    }
    if (
      this.filter.filterObj.itemType != null &&
      this.filter.filterObj.itemType != ''
    ) {
      searchRequest.itemType = this.filter.filterObj.itemType;
    }
    if (
      this.filter.filterObj.stockType != null &&
      this.filter.filterObj.stockType
    ) {
      searchRequest.stockType = this.filter.filterObj.stockType;
    }
    if (this.filter.filterObj)
      this.httpService
        .httpPost(
          `inventory/getItems?pageNo=${this.filter.pagination.page}&pageSize=${this.filter.pagination.pageSize}`,
          searchRequest
        )
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            this.inventoryItems = res;
            this.filter.pagination.dataCount = this.inventoryItems.length;
          },
          error: (err) => {
            this.triggerNotification({
              message: 'Error fetching inventory items',
              error: true,
            });
          },
        });
  }
  submit() {
    console.log(this.inventoryRequest.value);
    if (this.inventoryRequest.invalid) {
      this.inventoryRequest.markAllAsTouched();
      return;
    }
    
    let request:any = this.inventoryRequest.value;
    let formData = new FormData();
    if (this.selectedFile) formData.append('file', this.selectedFile!);

    for (const key in request) {
      formData.append(key, request[key]);
    }
    
    this.isLoading = true;
    this.httpService
      .httpPost('inventory/createInventory', formData)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.fetchInventoryItems();
        })
      )
      .subscribe({
        next: (res) => {
          this.triggerNotification({
            message: 'Inventory added successfully.',
            error: false,
          });
          this.closeInventoryForm();
        },
        error: (err) => {
          console.log(err);
          this.triggerNotification({
            message: 'Error creating inventory item.',
            error: true,
          });
        },
      });
  }
  closeInventoryForm() {
    this.inventoryRequest.reset();
    this.inventoryRequest.setValue({
      name: '',
      description: '',
      itemType: 0,
      quantityUnitType: 0,
      pricePerUnit: '',
      availableUnit: 0,
      minUnitToShowAlert: 0,
      file: ''
    });
    
    this.showInventoryForm = false;
  }
  openInventoryForm() {
    this.showInventoryForm = true;
  }
  clearFilter() {
    this.filter = {
      searchText: '',
      filterObj: {
        itemType: '',
        stockType: 0
      },
      pagination: {
        page: 1,
        pageSize: 5,
        dataCount: 5,
      },
    };
  }
  search() {}
  updatePaginationPage(page: number) {
    this.filter.pagination.page = page;
    this.fetchInventoryItems();
  }
  triggerNotification(message: any) {
    this.showNotification = false;
    this.notificationParams = null;
    this.showNotification = true;
    this.notificationParams = message;
  }
  openAddItemForm(selected: any) {
    this.selectedInventoryItem = selected;
    this.showAddDispatchForminAddMode = true;
    this.showAddDispatchForm = true;
  }

  openDispatchForm(selected: any) {
    this.selectedInventoryItem = selected;
    this.showAddDispatchForminAddMode = false;
    this.showAddDispatchForm = true;
  }
  closeAddDispatchForm() {
    this.showAddDispatchForm = false;
    this.addDispatchForm.reset();
  }
  submitAddDispatchItemForm() {
    this.isLoading = true;
    if (this.addDispatchForm.invalid) {
      this.isLoading = false;
      this.addDispatchForm.markAllAsTouched();
      return;
    }
    let request: any = this.addDispatchForm.value;
    if (
      !this.showAddDispatchForminAddMode &&
      this.selectedInventoryItem.availableUnit < request.numberOfItems
    ) {
      console.log(request);
      this.isLoading = false;
      this.triggerNotification({
        message: 'Not enough items in the store.',
        error: true,
      });
      return;
    }
    request.id = this.selectedInventoryItem._id;
    request.itemName = this.selectedInventoryItem.name;
    this.httpService
      .httpPost(
        `inventory/${this.showAddDispatchForminAddMode ? 'add' : 'dispatch'}`,
        request
      )
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.fetchInventoryItems();
        })
      )
      .subscribe({
        next: (res) => {
          this.triggerNotification({
            message: `Items ${
              this.showAddDispatchForminAddMode ? 'added' : 'dispatched'
            } succesfully`,
            error: false,
          });
          this.showAddDispatchForm = false;
          this.addDispatchForm.reset();
        },

        error: (err) => this.triggerNotification({ message: err, error: true }),
      });
  }

  showItemHistory(selected: any) {
    if (selected != null) this.selectedInventoryItem = selected;
    this.isLoading = true;

    let request: any = { inventoryItemId: selected._id };
    this.httpService
      .httpPost(
        `inventory/history?pageNo=${this.historyFilter.pagination.page}&pageSize=${this.historyFilter.pagination.pageSize}`,
        request
      )
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (res) => {
          this.itemHistory = res;
          this.showHistory = true;
        },
        error: (err) =>
          this.triggerNotification({ message: err, error: false }),
      });
  }
  closeItemHistory() {
    this.showHistory = false;
  }
  onFileSelect(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }
}
