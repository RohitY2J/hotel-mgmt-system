import { Component, Input, OnInit } from '@angular/core';
import { LoaderComponent } from '../shared/loader/loader.component';
import { NotificationComponent } from '../shared/notification/notification.component';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { HttpService } from '../../services/http-service.service';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IDropdownSettings,
  NgMultiSelectDropDownModule,
} from 'ng-multiselect-dropdown';
import { OrderFormComponent } from '../shared/order-form/order-form.component';
import { ConstantsService } from '../../services/constants.service';
import { InvoiceComponentComponent } from '../shared/invoice-component/invoice-component.component';
import { finalize } from 'rxjs';
import { PaginationComponent } from '../shared/pagination/pagination.component';
import { OrderItemComponent } from '../order-item/order-item.component';
import { Router, RouterModule } from '@angular/router';
import { ReservationFormComponent } from './reservation-form.component';
import { ModalComponent } from '../shared/modal/modal.component';
import { AutocompleteComponent } from '../shared/autocomplete/autocomplete.component';
import { ReservationGridComponent } from './reservation-grid.component';

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [
    LoaderComponent,
    NotificationComponent,
    SidebarComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgMultiSelectDropDownModule,
    OrderFormComponent,
    InvoiceComponentComponent,
    PaginationComponent,
    OrderItemComponent,
    RouterModule,
    ReservationFormComponent,
    ModalComponent,
    AutocompleteComponent,
    ReservationGridComponent
  ],
  templateUrl: './reservation.component.html',
  styleUrl: './reservation.component.scss',
})
export class ReservationComponent implements OnInit {
  notificationParams: any;
  isConfirmDialogOpen: any = false;
  showNotification: any = false;
  isLoading: any = false;
  reservations: any = [];
  isReservationFormOpen: any = false;
  isUpdateMode: any = false;
  paymentStatus: any = [];
  initialStatus: any = [];
  allStatus: any = [];
  isOrderComponentVisible: boolean = false;
  isInvoiceComponentVisible: boolean = false;
  isCheckOutFormVisible: boolean = false;
  showPrintInvoiceMessage: boolean = false;
  initialTotalAmountForSelected: number = 0;

  // customOptionTemplate = true;
  // selectedOptions: string[] = [];
  // options = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
  // isSelected(option: string): boolean {
  //   return this.selectedOptions.includes(option);
  // }
  // toggleOption(option: string) {
  //   if (this.selectedOptions.includes(option)) {
  //     this.selectedOptions = this.selectedOptions.filter(o => o !== option);
  //   } else {
  //     this.selectedOptions.push(option);
  //   }
  // } 

  filter: any = {
    searchText: '',
    filterObj: {
      paymentStatus: '',
      status: '',
    },
    pagination: {
      page: 1,
      pageSize: 5,
      dataCount: 5,
    },
  };
  defaultCheckOutModel = {
    discount: 0,
    tax: 0,
    flatDiscount: 0,
    checkOutDate: Date.now(),
    paidAmount: 0
  };

  checkOutModel = this.defaultCheckOutModel;

  selectedItems: any = [];
  dropdownSettings: IDropdownSettings = {};
  allRooms: any = [];
  isOrdersFormVisible: boolean = false;
  printInvoiceVisible: boolean = true;
  selectedReservation: any;
  formMode: any = 'create';

  searchControl = new FormControl();
  filteredOptions: string[] = [];


  constructor(
    private httpService: HttpService,
    public constService: ConstantsService,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.getReservations();
    this.initialStatus = [
      { item_id: 0, item_text: 'Booked' },
      { item_id: 1, item_text: 'Checked In' },
    ];

    this.dropdownSettings = {
      singleSelection: false,
      idField: 'id',
      textField: 'roomNumber',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 3,
      allowSearchFilter: true,
    };
  }

  async updateFilterOptions(value: string) {
    this.filteredOptions = await this.filterOptions(value);
  }

  async filterOptions(value: string): Promise<string[]> {
    const filterValue = value.toLowerCase();
    try {
      const res: any = await this.httpService.httpPost(`reservation/getCustomerName`, { filterValue }).toPromise();
      return res.data || [];
    } catch (err) {
      this.triggerNotification({
        message: 'Failed to get customer names',
        error: true
      });
      return [];
    }
  }

  ordersForm = new FormGroup({
    orderSummary: new FormControl('', Validators.required),
    orderPrice: new FormControl('', Validators.required),
  });
  //TODO
  deleteButtonClicked(reservation: any) {}
  editButtonClicked(reservation: any) {}
  search() {
    this.getReservations();
  }

  searchInputChanged(e: any) {}

  getReservations() {
    this.isLoading = true;
    this.filter.filterObj.customerFullName = this.searchControl.value
    this.httpService
      .httpPost(
        `reservation/getReservations?pageNo=${this.filter.pagination.page}&pageSize=${this.filter.pagination.pageSize}`,
        this.filter.filterObj
      )
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (res) => {
          this.reservations = res;
          if (this.selectedReservation != null)
            this.selectedReservation = this.reservations.find(
              (r: any) => r.id === this.selectedReservation.id
            );
          console.log(this.selectedReservation);
        },
        error: (err) => console.log,
        complete: () => (this.isLoading = false),
      });
  }

  closeReservationModal() {
    this.isReservationFormOpen = false;
    this.getReservations();
  }
  openCreateReservationForm(formMode: String = 'create') {
    this.formMode = formMode;
    this.isReservationFormOpen = true;
  }

  showInvoice(reservation: any) {
    this.selectedReservation = reservation;
    this.isInvoiceComponentVisible = true;
  }

  closeInvoce() {
    this.isInvoiceComponentVisible = false;
  }

  triggerNotification(message: any) {
    this.showNotification = true;
    this.notificationParams = message;
  }

  orderButtonClicked(reservationItem: any) {
    this.selectedReservation = reservationItem;
    this.isOrderComponentVisible = true;
  }
  closeOrdersForm() {
    this.isOrdersFormVisible = false;
    this.getReservations();
  }
  closeOrderComponent() {
    this.isOrderComponentVisible = false;
    this.getReservations();
  }
  getOrderAmount(reservationItem: any) {
    return reservationItem.billing.orders.reduce(
      (a: any, o: any) => a + o.price * o.qty,
      0
    );
  }
  checkIn(reservation: any) {
    this.httpService
      .httpPost(`reservation/updateReservation`, {
        id: reservation.id,
        status: 1,
      })
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.showNotification = true;
        })
      )
      .subscribe({
        next: (res) => {
          this.notificationParams = {
            message: 'Checked In successfully.',
            error: false,
          };
          this.getReservations();
        },
        error: (err) => {
          this.notificationParams = {
            message: 'Invalid CheckIn request.',
            error: true,
          };
        },
      });
  }

  clearFilter() {
    this.filter = {
      searchText: '',
      filterObj: {
        paymentStatus: '',
        status: '',
      },
      pagination: {
        page: 1,
        pageSize: 5,
        dataCount: 5,
      },
    };
    this.searchControl.setValue("");
    this.getReservations();
  }
  updatePaginationPage(page: number) {
    this.filter.pagination.page = page;
    this.getReservations();
  }

  openCheckOutForm(reservation: any) {
    this.selectedReservation = reservation;
    this.initialTotalAmountForSelected = reservation.billing.totalPaidAmount;
    this.checkOutModel.checkOutDate = this.selectedReservation.checkOutDate;
    console.log(this.checkOutModel.checkOutDate);
    this.isCheckOutFormVisible = true;
  }
  closeCheckOutForm() {
    this.isCheckOutFormVisible = false;
    this.initialTotalAmountForSelected = 0;
    this.resetCheckOutModal();
    this.getReservations();
  }

  resetCheckOutModal(){
    this.checkOutModel  = {
      discount: 0,
      tax: 0,
      flatDiscount: 0,
      checkOutDate: Date.now(),
      paidAmount: 0
    };
  }
  checkOutAndPrintInvoice() {
    this.isLoading = true;
    // this.selectedReservation.billing.discountPercentage =
    //   this.checkOutModel.discount;
    // this.selectedReservation.billing.taxPercentage = this.checkOutModel.tax;
    // this.selectedReservation.billing.flatDiscount =
    //   this.checkOutModel.flatDiscount;
    // this.selectedReservation.checkOutDate = this.checkOutModel.checkOutDate;

    this.selectedReservation.status = 2; //checkout
    this.selectedReservation.paymentStatus = 1; //paid

    this.httpService
      .httpPost(`reservation/updateReservation`, this.selectedReservation)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.showNotification = true;
        })
      )
      .subscribe({
        next: (res) => {
          this.notificationParams = {
            message: 'Check out successfully.',
            error: false,
          };
          this.isCheckOutFormVisible = false;
          this.printInvoice();
        },
        error: (err) => {
          this.notificationParams = {
            message: 'Invalid checkout request.',
            error: true,
          };
        },
      });
  }
  toggleLoader(toggleVal: boolean) {
    this.isLoading = toggleVal;
  }

  printInvoice() {
    this.router.navigate(['/print-invoice'], {
      queryParams: { id: this.selectedReservation.id },
    });
  }
  onCheckOutFormChange() {
    this.selectedReservation.billing.discountPercentage =
      this.checkOutModel.discount;
    this.selectedReservation.billing.taxPercentage = this.checkOutModel.tax;
    this.selectedReservation.billing.flatDiscount =
      this.checkOutModel.flatDiscount;
    this.selectedReservation.checkOutDate = this.checkOutModel.checkOutDate;
    this.selectedReservation.billing.totalPaidAmount = this.initialTotalAmountForSelected + this.checkOutModel.paidAmount;
  }
}
