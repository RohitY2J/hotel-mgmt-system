import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http-service.service';
import { NotificationComponent } from '../shared/notification/notification.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConstantsService } from '../../services/constants.service';
import { LoaderComponent } from '../shared/loader/loader.component';
import { finalize } from 'rxjs';
import { HttpListResponse } from '../../models/HttpResponse';
import { PaginationComponent } from '../shared/pagination/pagination.component';

@Component({
  selector: 'app-menu-item',
  standalone: true,
  imports: [
    NotificationComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LoaderComponent,
    PaginationComponent
  ],
  templateUrl: './menu-item.component.html',
  styleUrl: './menu-item.component.scss'
})
export class MenuItemComponent implements OnInit {
  pageNo: Number = 1;
  showNotification: boolean = false;
  notificationParams: any = {};
  pageSize: Number = 10;
  allMenus: any = [];
  isMenuFormOpen: any = false;
  isLoading: boolean = false;
  isUpdate: boolean = false;
  menuForm: FormGroup = new FormGroup({}); 

  selectedFile: File | undefined;

  filter: any = {
    menuName: "",
    availableStatus: "",
    pagination: {
      page: 1,
      pageSize: 8,
      dataCount: 8
    }
  }

  constructor(private fb: FormBuilder, private httpService: HttpService, public constantService: ConstantsService) { }

  ngOnInit(): void {
    this.fetchMenuItems();

    this.menuForm = this.fb.group({
      id: new FormControl(''),
      name: new FormControl('', Validators.required),
      description: new FormControl(''),
      price: new FormControl(0, Validators.required),
      category: new FormControl(''),
      available: new FormControl('', Validators.required)
    });

  }

  openMenuForm() {
    this.isUpdate = false;
    this.updateMenuForm();
    this.isMenuFormOpen = true;
  }

  fetchMenuItems() {
    this.isLoading = true;
    this.httpService
      .httpPost(
        'menu/getMenuItems',
        this.filter
      )
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        next: (res) => {
          console.log(res);
          let response = res as HttpListResponse; 
          this.allMenus = response.data;
          this.filter.pagination.dataCount = response.data.length;
        },
        error: (err) => this.triggerNotification({ 
          message: "Failed to retrieve data", 
          error: true }),
      });
  }

  triggerNotification(notificationContent: any) {
    this.notificationParams = notificationContent;
    this.showNotification = true;
  }
  closeModal() {
    this.isMenuFormOpen = false;
    this.menuForm.reset();
    this.menuForm.setValue({
      id: '',
      name: '',
      description: '',
      price: 0,
      category: '',
      available: '',
      //inventoryId: ''
    });
  }
  formSubmitted() {
    this.showNotification = false;
    if (this.menuForm.valid) {

      let formData = new FormData();
      if (this.selectedFile) {
        formData.append('file', this.selectedFile!);
      }

      Object.keys(this.menuForm.value).forEach(key => {
        formData.append(key, this.menuForm.value[key]);
      });

      this.isLoading = true;
      if (this.isUpdate) {
        this.httpService
          .httpPost(`menu/updateMenuItem`, formData)
          .pipe(finalize(() => {
            this.isLoading = false;
          }))
          .subscribe({
            next: (res) => {
              this.triggerNotification({
                message: 'MenuItem Updated Successfully',
                error: false
              });
              this.fetchMenuItems();
              this.closeModal();
            },
            error: (err) => {
              this.triggerNotification({
                message: 'Room update failed',
                error: true
              });
            }
          })
      }
      else {
        this.httpService
          .httpPost(`/menu/createMenuItem`, formData)
          .pipe(finalize(() => {
            this.isLoading = false;
          }))
          .subscribe({
            next: (res) => {
              this.triggerNotification({
                message: 'Menu item created successfully',
                error: false,
              });
              this.fetchMenuItems();
              this.closeModal();
            },
            error: (err) => {
              this.triggerNotification({
                message: err.error.msg,
                error: true,
              });
            },
          });
      }
    }
    else {
      this.constantService.markFormGroupTouched(this.menuForm);
    }
  }

  openUpdateForm(menu: any) {
    this.menuForm.setValue({
      id: menu._id,
      name: menu.name,
      description: menu.description,
      price: menu.price,
      category: menu.category,
      available: menu.available ? 1 : 0,
      //inventoryId: menu.inventoryId ?? ""
    });
    this.isUpdate = true;
    this.updateMenuForm();
    this.isMenuFormOpen = true;
  }

  updateMenuForm() {
    if (this.isUpdate) {
      this.menuForm.get("name")?.disable();
    }
    else {
      this.menuForm.get("name")?.enable();
    }
  }

  searchButtonClicked() {
    this.fetchMenuItems();
  }

  clearFilter() {
    this.filter = {
      menuName: "",
      availableStatus: "",
      pagination: {
        page: 1,
        pageSize: 8,
        dataCount: 8
      }
    };
    this.fetchMenuItems();
  }

  onFileSelect(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  getMenuAvailabilityStatus(menuStatus: boolean){
    return this.constantService.getStatusString("menuAvailabilityStatus", menuStatus ? 1 : 0);
  }

  updatePaginationPage(page: number){
    this.filter.pagination.page = page;
    this.fetchMenuItems();
  }
}

