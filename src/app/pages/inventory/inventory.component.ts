import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
  imports: [NotificationComponent, LoaderComponent, FormsModule, CommonModule, PaginationComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss'
})
export class InventoryComponent implements OnInit{

  showNotification: boolean = false;
  isLoading: boolean = false;
  showInventoryForm: boolean = false;
  showFormInUpdateMode: boolean = false;
  inventoryItems: any = [];
  notificationParams: any = {};
  quantityUnitType = [
    {id: 0, text: 'Unit'},
    {id: 1, text: 'ML'},
  ];
  itemType = [
    {id: 0, text: 'Unit'},
    {id: 1, text: 'ML'},
  ];
  filter:any = { 
    searchText: "",
    filterObj: {
      itemType: "",
    },
    pagination: {
      page: 1,
      pageSize: 5,
      dataCount:5
    } 
  }

  constService: ConstantsService;
  constructor(constService: ConstantsService, private httpService: HttpService){
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
    minUnitToShowAlert: new FormControl(0)

  });

  fetchInventoryItems(){

    this.isLoading = true;
    let searchRequest:any = {};
    if(this.filter.searchText != null){
      searchRequest.name = {$regex: this.filter.searchText, $options: 'i'};
    }
    if(this.filter.filterObj.itemType!= null && this.filter.filterObj.itemType!= ""){
      searchRequest.itemType = this.filter.filterObj.itemType
    }
    if(this.filter.filterObj)
    this.httpService.httpPost(`inventory/getItems?pageNo=${this.filter.pagination.page}&pageSize=${this.filter.pagination.pageSize}`,searchRequest)
     .pipe(finalize(()=>{
      this.isLoading = false;
     }))
     .subscribe({
      next: (res)=>{
        this.inventoryItems = res
      },
      error: (err)=>{
        this.triggerNotification({
          message: 'Error fetching inventory items',
          error: true,
        })
      }
     })
  }
  submit(){

    console.log(this.inventoryRequest.value);
    if(this.inventoryRequest.invalid){
      this.inventoryRequest.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.httpService.httpPost('inventory/createInventory',this.inventoryRequest.value).pipe(finalize(()=>{
this.isLoading = false;
this.fetchInventoryItems();
    })).subscribe({
      next: (res)=>{
        this.triggerNotification({
          message: 'Inventory added successfully.',
          error: true,
        });
      },
      error:(err)=>{
        this.triggerNotification({
          message: 'Error creating inventory item.',
          error: true,
        });
      }
    });
  }
  closeInventoryForm(){
    this.showInventoryForm  = false;
  }
  openInventoryForm(){
    this.showInventoryForm = true;
  }
  clearFilter(){
    this.filter = { 
      searchText: "",
      filterObj: {
        itemType: "",
      },
      pagination: {
        page: 1,
        pageSize: 5,
        dataCount: 5
      } 
    }
  }
  search(){

  }
  updatePaginationPage(page: number){
    this.filter.pagination.page = page;
    // this.getReservations();
  }
  triggerNotification(message: any) {
    this.showNotification = true;
    this.notificationParams = message;
  }
}
