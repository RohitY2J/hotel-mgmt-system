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
  selector: 'app-order-table',
  standalone: true,
  imports: [
    NotificationComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LoaderComponent,
    PaginationComponent
  ],
  templateUrl: './order-table.component.html',
  styleUrl: './order-table.component.scss'
})
export class OrderTableComponent implements OnInit {
  pageNo: Number = 1;
  showNotification: boolean = false;
  notificationParams: any = {};
  pageSize: Number = 10;
  allTables: any = [];
  istableFormOpen: any = false;
  isLoading: boolean = false;
  isUpdate: boolean = false;
  tableForm: FormGroup = new FormGroup({});

  selectedFile: File | undefined;

  filter: any = {
    tableNumber: "",
    status: "",
    pagination: {
      page: 1,
      pageSize: 8,
      dataCount: 8
    }
  }

  tableStatus: {key: Number, value: string}[] | undefined;

  constructor(private fb: FormBuilder, private httpService: HttpService, public constantService: ConstantsService) { }

  ngOnInit(): void {

    this.tableStatus = this.constantService.getStatusValuesAsDictionary('tableAvailableStatus');

    this.fetchTabels();

    this.tableForm = this.fb.group({
      id: new FormControl(''),
      tableNumber: new FormControl('', Validators.required),
      location: new FormControl('', Validators.required),
      status: new FormControl('1', Validators.required),
      capacity: new FormControl('', Validators.required),
    });

  }

  openTableForm() {
    this.isUpdate = false;
    this.updateTableForm();
    this.istableFormOpen = true;
  }

  fetchTabels() {
    this.isLoading = true;
    this.httpService
      .httpPost(
        'table/getTables',
        this.filter
      )
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        next: (res) => {
          console.log(res);
          let response = res as HttpListResponse;
          this.allTables = response.data;
          this.filter.pagination.dataCount = response.data.length;
        },
        error: (err) => this.triggerNotification({
          message: "Failed to retrieve data",
          error: true
        }),
      });
  }

  triggerNotification(notificationContent: any) {
    this.notificationParams = notificationContent;
    this.showNotification = true;
  }
  closeModal() {
    this.istableFormOpen = false;
    this.tableForm.reset();
    this.tableForm.setValue({
      id: '',
      status: 1,
      tableNumber: '',
      location: '',
      capacity: ''
    });
  }
  formSubmitted() {
    this.showNotification = false;
    if (this.tableForm.valid) {
      this.isLoading = true;
      if (this.isUpdate) {
        this.httpService
          .httpPost(`table/updateTable`, this.tableForm.value)
          .pipe(finalize(() => {
            this.isLoading = false;
          }))
          .subscribe({
            next: (res) => {
              this.triggerNotification({
                message: 'Table Updated Successfully',
                error: false
              });
              this.fetchTabels();
              this.closeModal();
            },
            error: (err) => {
              this.triggerNotification({
                message: 'Table update failed',
                error: true
              });
            }
          })
      }
      else {
        this.httpService
          .httpPost(`/table/createTable`, this.tableForm.value)
          .pipe(finalize(() => {
            this.isLoading = false;
          }))
          .subscribe({
            next: (res) => {
              this.triggerNotification({
                message: 'Table created successfully',
                error: false,
              });
              this.fetchTabels();
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
      this.constantService.markFormGroupTouched(this.tableForm);
    }
  }

  openUpdateForm(table: any) {
    this.tableForm.setValue({
      id: table._id,
      status: table.status,
      tableNumber: table.tableNumber,
      location: table.location,
      capacity: table.capacity
    });
    this.isUpdate = true;
    this.updateTableForm();
    this.istableFormOpen = true;
  }

  updateTableForm() {
    if (this.isUpdate) {
      this.tableForm.get("tableNumber")?.disable();
    }
    else {
      this.tableForm.get("tableNumber")?.enable();
    }
  }

  searchButtonClicked() {
    this.fetchTabels();
  }

  clearFilter() {
    this.filter = {
      tableNumber: "",
      status: "",
      pagination: {
        page: 1,
        pageSize: 8,
        dataCount: 8
      }
    };
    this.fetchTabels();
  }

  updatePaginationPage(page: number) {
    this.filter.pagination.page = page;
    this.fetchTabels();
  }

  quickViewTable(table: any): void {
    // Implementation for quick view functionality
    console.log('Quick view for table:', table);
    // You could open a small modal or sidebar with table details
  }

  viewMode: 'grid' | 'table' = 'grid';
  // Filter object
  // filter:any = {
  //   status: '',
  //   tableNumber: '',
  //   pagination: {
  //     page: 1,
  //     pageSize: 10,
  //     dataCount: 0
  //   }
  // };

  // New methods for enhanced functionality
  setViewMode(mode: 'grid' | 'table'): void {
    this.viewMode = mode;
  }

  toggleTableStatus(table: any): void {
    // Toggle between available (1) and occupied (0)
    table.status = table.status === 1 ? 0 : 1;
    // Here you would typically call an API to update the status
    console.log(`Table ${table.tableNumber} status changed to:`, table.status);
    //this.showSuccessNotification(`Table ${table.tableNumber} status updated successfully`);
  }
}
