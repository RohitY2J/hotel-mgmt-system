import { Component, EventEmitter, Input, Output } from '@angular/core';
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
    ModalComponent
  ],
  templateUrl: './reservation-form.component.html',
 styleUrl: './reservation.component.scss',
})
export class ReservationFormComponent {
  @Output() onLoader = new EventEmitter<boolean>();
  @Output() onAlert = new EventEmitter<any>();
  @Output() onModalClose = new EventEmitter<void>();
  @Input ({required: true}) openMode: String = 'create';

  constructor(
    private httpService: HttpService,
    private constService: ConstantsService
  ) {
    this._constService = constService;
  }

  _constService: any = null;
  allRooms: any = [];
  selectedRoom: any = {};
  showAddRooms:boolean = false;
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
      rooms: new FormControl([], Validators.required),
      paymentStatus: new FormControl('', Validators.required),
      totalPaidAmount: new FormControl(0),
    },
    {
      validators: dateRangeValidator('checkInDate', 'checkOutDate'),
    }
  );

  addRoomForm = new FormGroup({
    roomNumber: new FormControl('', Validators.required),
    price: new FormControl(this.selectedRoom.pricePerDay, Validators.required)
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
    this.resetForm();;
    this.closeModal();
  };

  submit() {
    this.onLoader.emit(true);
    console.log(this.createReservationRequest.value);
    if (this.createReservationRequest.invalid) {
      let notificationParams = { message: 'Invalid form', error: true };
      this.onAlert.emit(notificationParams);
      this.onLoader.emit(false);
      this.createReservationRequest.markAllAsTouched();
      return;
    }

    let request: any = this.createReservationRequest.value;
    request.billing = {
      orders: [],
      totalPaidAmount: this.createReservationRequest.value.totalPaidAmount,
    };
    let rooms: any = this.createReservationRequest.value.rooms?.map(
      (x: any) => {
        let room = this.allRooms.find((r: any) => r.id == x.id);
        return room.id;
      }
    );
    request.rooms = rooms;
    console.log(request);
    this.httpService
      .httpPost('reservation/createReservation', request)
      .pipe(
        finalize(() => {
          this.onAlert.emit(false);
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
  update(){

  }
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
      rooms: [],
      paymentStatus: '',
      totalPaidAmount:0
    });
  }
  onRoomSelect(item: any){

  }
}

