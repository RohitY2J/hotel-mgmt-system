import { Component, OnInit } from '@angular/core';
import { LoaderComponent } from '../shared/loader/loader.component';
import { NotificationComponent } from '../shared/notification/notification.component';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { HttpService } from '../../services/http-service.service';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IDropdownSettings, NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { OrderFormComponent } from '../shared/order-form/order-form.component';
import { ConstantsService } from '../../services/constants.service';
import { InvoiceComponentComponent } from '../shared/invoice-component/invoice-component.component';

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
    InvoiceComponentComponent
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
  paymentStatus: any = [];
  initialStatus: any = [];

  selectedItems: any = [];
  dropdownSettings: IDropdownSettings = {};
  allRooms: any = [];
  isOrdersFormVisible: boolean = false;
  printInvoiceVisible: boolean = false;
  selectedReservation: any = {};
  formMode: any = 'create';

  constructor(private httpService: HttpService, private constService: ConstantsService) {}
  ngOnInit(): void {
    this.getReservations();
    this.fetchRooms();
    this.paymentStatus = [
      { item_id: 0, item_text: 'Paid' },
      { item_id: 1, item_text: 'Unpaid' },
      { item_id: 2, item_text: 'Partially Paid' },
    ];
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
  createReservationRequest = new FormGroup({
    customerFullName: new FormControl('', Validators.required),
    numberOfIndividuals: new FormControl('', Validators.required),
    checkInDate: new FormControl('', Validators.required),
    checkOutDate: new FormControl('', Validators.required),
    status: new FormControl('', Validators.required),
    customerContact: new FormGroup({
      phone: new FormControl('', Validators.required),
      address: new FormControl(''),
    }),
    rooms: new FormControl([], Validators.required),
    paymentStatus: new FormControl('', Validators.required),
  });
  ordersForm = new FormGroup({
    orderSummary: new FormControl('', Validators.required),
    orderPrice: new FormControl('', Validators.required),
  });
  deleteButtonClicked(reservation: any) {}
  editButtonClicked(reservation: any) {}
  searchButtonClicked() {}

  closeConfirmDialog() {}

  openModalForCreatingEmployee() {}

  confirmButtonClicked() {}
  searchInputChanged(e: any) {}

  getReservations() {
    this.isLoading = true;
    this.httpService
      .httpPost('reservation/getReservations?pageNo=1&pageSize=100', {})
      .subscribe({
        next: (res) => (this.reservations = res),
        error: (err) => console.log,
        complete: () => (this.isLoading = false),
      });
  }
  fetchRooms() {
    this.httpService
      .httpPost(`room/getRooms?pageSize=100&pageNo=1`, {
        occupancyStatus: 0,
      })
      .subscribe({
        next: (res) => {
          console.log(res);
          this.allRooms = res;
        },
        error: (err) => console.log,
      });
  }

  closeModal() {
    this.isReservationFormOpen = false;
  }
  openCreateReservationForm() {
    this.formMode = 'create';
    this.createReservationRequest.reset();
    this.isReservationFormOpen = true;
  }
  onItemSelect(item: any) {
    console.log(item);
  }
  onSelectAll(items: any) {
    console.log(items);
  }
  formSubmitted() {
    console.log(this.createReservationRequest.value);
    if (this.createReservationRequest.invalid) {
      this.showNotification = true;
      this.notificationParams = { message: 'Invalid form', error: true };
      return;
    }

    let request:any = this.createReservationRequest.value;
    request.billing = { orders: [] };
    let rooms: any = this.createReservationRequest.value.rooms?.map(
      (x: any) => {
        let room = this.allRooms.find((r: any) => r.id == x.id);
        request.billing.orders.push({
          summary: `Room: ${room.roomNumber}`,
          amount:
            room.pricePerDay *
            Math.floor(
              (Date.parse(request.checkOutDate) -
                Date.parse(request.checkInDate)) /
                (1000 * 60 * 60 * 24)
            ),
        });
        return room.id;
      }
    );
    request.rooms = rooms;
    this.httpService
      .httpPost(
        'reservation/createReservation',
        this.createReservationRequest.value
      )
      .subscribe({
        next: () => {
          this.showNotification = true;
          this.notificationParams = {
            message: 'Reservation created successfully.',
            error: false,
          };
          this.getReservations();
          this.closeModal();
        },
        error: (err) => {
          this.showNotification = true;
          this.notificationParams = {
            message: 'Could not create reservation',
            error: true,
          };
          this.closeModal();
        },
      });
  }

  submitOrder(reservationItem: any) {
    if (this.ordersForm.invalid) {
      this.showNotification = true;
      this.notificationParams = {
        message: 'Invalid form. Please fill all the required fields.',
        error: true,
      };
      return;
    }
    console.log(this.ordersForm.value);
  }

  triggerNotification(message: any) {
    this.showNotification = true;
    this.notificationParams = message;
  }

  orderButtonClicked(reservationItem: any) {
    this.selectedReservation = reservationItem;
    this.isOrdersFormVisible = true;
  }
  closeOrdersForm() {
    this.isOrdersFormVisible = false;
    this.getReservations();
  }
  getOrderAmount(reservationItem:any){

    return reservationItem.billing.orders.reduce(
      (a:any,o:any)=> a + o.amount, 0
  );

  }
 
}
