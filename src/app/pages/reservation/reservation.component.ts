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
  };

  checkOutModel = this.defaultCheckOutModel;

  selectedItems: any = [];
  dropdownSettings: IDropdownSettings = {};
  allRooms: any = [];
  isOrdersFormVisible: boolean = false;
  printInvoiceVisible: boolean = true;
  selectedReservation: any;
  formMode: any = 'create';

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
    this.filter.filterObj.customerFullName = {
      $regex: this.filter.searchText,
      $options: 'i',
    };
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
  openCreateReservationForm(formMode: String = "create") {
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
    this.getReservations();
  }
  updatePaginationPage(page: number) {
    this.filter.pagination.page = page;
    this.getReservations();
  }

  openCheckOutForm(reservation: any) {
    this.selectedReservation = reservation;
    this.checkOutModel = this.defaultCheckOutModel;
    this.checkOutModel.checkOutDate = this.selectedReservation.checkOutDate;
    console.log(this.checkOutModel.checkOutDate);
    this.isCheckOutFormVisible = true;
  }
  closeCheckOutForm() {
    this.isCheckOutFormVisible = false;
    this.getReservations();
  }

  checkOutAndPrintInvoice() {
    this.isLoading = true;
    this.selectedReservation.billing.discountPercentage =
      this.checkOutModel.discount;
    this.selectedReservation.billing.taxPercentage = this.checkOutModel.tax;
    this.selectedReservation.billing.flatDiscount =
      this.checkOutModel.flatDiscount;
    this.selectedReservation.checkOutDate = this.checkOutModel.checkOutDate;

    this.selectedReservation.status = 2; //checkout

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
}
