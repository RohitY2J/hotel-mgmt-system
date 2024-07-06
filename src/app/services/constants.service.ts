import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

interface StatusMaps {
  attendanceStatus: { [key: number]: string };
  shiftStatus: { [key: number]: string };
  shift: { [key: number]: string };
  shiftTiming: { [key: number]: string };
  roomOccupancyStatus: { [key: number]: string };
  roomMaintainanceStatus: { [key: number]: string };
  paymentStatus: { [key: number]: string };
  reservationStatus: { [key: number]: string };
}

@Injectable({
  providedIn: 'root'
})
export class ConstantsService {
  private statusMap: StatusMaps = {
    attendanceStatus: {
      0: "Scheduled",
      1: "Present",
      2: "Absent",
      3: "On Leave"
    },
    shiftStatus: {
      0: 'Scheduled',
      1: 'Cancelled',
      2: 'Completed'
    },
    shift: {
      0: 'Normal',
      1: 'Night',
      2: 'Morning',
      3: 'Evening'
    },
    shiftTiming: {
      0: '10am - 5pm',
      1: '8pm - 4am',
      2: '6am - 2pm',
      3: '3pm - 11pm'
      // Add more as needed
    },
    roomOccupancyStatus:{
       0: "Available",
       1: "Occupied",
    },
    roomMaintainanceStatus: {
      0:"Dirty",
      1:"Clean"
    },
    paymentStatus:{
      0: "Paid",
      1: "Unpaid",
      2: "PartiallyPaid"
    },
    reservationStatus:{
      0: "Booked",
      1: "CheckedIn",
      2: "Closed",
      3: "Canceled"
    },
  };


  getStatusString(mapKey: keyof StatusMaps, statusCode: number): string {
    const map = this.statusMap[mapKey];
    if (map && map[statusCode]) {
      return map[statusCode];
    }
    return 'Unknown';
  }

  getStatusValuesAsDictionary(mapKey: keyof StatusMaps): { key: number, value: string }[] {
    const map = this.statusMap[mapKey];
    return Object.keys(map).map(key => ({
      key: Number(key),
      value: map[Number(key)]
    }));
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

}
