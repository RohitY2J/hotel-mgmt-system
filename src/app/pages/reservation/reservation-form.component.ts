import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ConstantsService } from '../../services/constants.service';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { dateRangeValidator } from '../../services/dateRangeValidator';
import { HttpService } from '../../services/http-service.service';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { finalize } from 'rxjs';
import { ModalComponent } from '../shared/modal/modal.component';

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgMultiSelectDropDownModule,
    ModalComponent,
  ],
  templateUrl: './reservation-form.component.html',
  styleUrl: './reservation.component.scss',
})
export class ReservationFormComponent implements OnInit {
  @Output() onLoader = new EventEmitter<boolean>();
  @Output() onAlert = new EventEmitter<any>();
  @Output() onModalClose = new EventEmitter<void>();
  @Input({ required: true }) openMode: String = 'create';

  constructor(
    private httpService: HttpService,
    private constService: ConstantsService
  ) {
    this._constService = constService;
  }
  ngOnInit(): void {
    this.getRooms();
  }

  _constService: any = null;
  allRooms: any = [];
  selectedRoom: any = {};
  selectedRooms: any[] = [];
  showAddRooms: boolean = false;
  initialStatus: any = [
    { item_id: 0, item_text: 'Booked' },
    { item_id: 1, item_text: 'Checked In' },
  ];
  dropdownSettings: any = {
    singleSelection: false,
    idField: 'id',
    textField: 'roomNumber',
    selectAllText: 'Select All',
    unSelectAllText: 'UnSelect All',
    itemsShowLimit: 3,
    allowSearchFilter: true,
    enableCheckAll: false,
  };

  createReservationRequest = new FormGroup(
    {
      customerFullName: new FormControl('', Validators.required),
      numberOfIndividuals: new FormControl('', Validators.required),
      checkInDate: new FormControl('', Validators.required),
      checkOutDate: new FormControl('', Validators.required),
      status: new FormControl('', Validators.required),
      customerContact: new FormGroup({
        phone: new FormControl('', Validators.required),
        address: new FormControl(''),
      }),
      totalPaidAmount: new FormControl(0),
    },
    {
      validators: dateRangeValidator('checkInDate', 'checkOutDate'),
    }
  );

  addRoomForm = new FormGroup({
    roomNumber: new FormControl([], Validators.required),
    price: new FormControl(this.selectedRoom.pricePerDay, Validators.required),
  });

  getRooms() {
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

  closeModal = () => this.onModalClose.emit();
  showLoader = () => this.onLoader.emit(true);
  closeLoader = () => this.onLoader.emit(false);
  showAlert = (message: any) => this.onAlert.emit(message);
  onFormSubmittedSuccessfully = () => {
    this.resetForm();
    this.closeModal();
  };

  submit() {
    console.log(this.createReservationRequest.value);
    this.onLoader.emit(true);
    if (this.createReservationRequest.invalid) {
      let notificationParams = { message: 'Invalid form', error: true };
      this.showAlert(notificationParams);
      this.showLoader();
      this.createReservationRequest.markAllAsTouched();
      return;
    }

    let request: any = this.createReservationRequest.value;

    request.billing = {
      orders: [],
      totalPaidAmount: this.createReservationRequest.value.totalPaidAmount,
    };
    let rooms: any = this.selectedRooms;
    request.paymentStatus = request.totalPaidAmount > 0 ? 2:0;

    request.rooms = rooms;
    this.httpService
      .httpPost('reservation/createReservation', request)
      .pipe(
        finalize(() => {
          this.closeLoader();
          this.closeModal();
        })
      )
      .subscribe({
        next: () => {
          this.showAlert({
            message: 'Reservation created successfully.',
            error: false,
          });
          this.onFormSubmittedSuccessfully();
        },
        error: (err) => {
          this.createReservationRequest.markAllAsTouched();
          this.showAlert({
            message: 'Could not create reservation',
            error: true,
          });
        },
      });
  }
  update() {}
  resetForm() {
    this.createReservationRequest.reset();
    this.createReservationRequest.setValue({
      customerFullName: '',
      numberOfIndividuals: '',
      checkInDate: '',
      checkOutDate: '',
      status: '',
      customerContact: {
        phone: '',
        address: '',
      },
      totalPaidAmount: 0,
    });
  }
  onRoomSelect(item: any) {
    this.showAddRooms = true;
  }

  addRooms() {
    if (this.addRoomForm.invalid) {
      this.showAlert({
        message: 'Please enter room number and price',
        error: true,
      });
      return;
    }
    let price = this.addRoomForm.value.price;
    this.addRoomForm.value.roomNumber?.map((room: any) => {
      this.selectedRooms.push({
        id: room.id,
        roomNumber: room.roomNumber,
        price: price,
      });
    });
    console.log(this.selectedRooms);
    this.addRoomForm.reset();
  }
  removeRoom(room: any) {
    this.selectedRooms = this.selectedRooms.filter((x) => x.id != room.id);
    console.log(this.selectedRooms);
  }
}

