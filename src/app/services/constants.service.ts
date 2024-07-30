import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { StatusMaps } from '../models/Status';

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
    roomOccupancyStatus: {
      0: "Available",
      1: "Booked",
      2: "CheckedIn"
    },
    roomMaintainanceStatus: {
      0: "Dirty",
      1: "Clean"
    },
    paymentStatus: {
      0: "Unpaid",
      1: "Paid",
      2: "PartiallyPaid"
    },
    reservationStatus: {
      0: "Booked",
      1: "Checked In",
      2: "Closed",
      3: "Canceled"
    },
    menuAvailabilityStatus: {
      0: "Not Available",
      1: "Available"
    },
    orderStatus: {
      0: "Pending",
      1: "Served",
      2: "Cancelled",
      3: "Billed"
    },
    inventoryItemType: {
      0: "Menu",
      1: "Others",
    },
    quantityUnitType: {
      0: "Unit",
      1: "ML",
    },
    tableAvailableStatus:{
      0: "Occupied",
      1: "Available"
    },
    stockAvailable:{
      0: "All Stock",
      1: "Low in Stock",
      2: "Out of Stock"
    }
    
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

  getDateTodayString(){
    let today = new Date();

    // Get day, month, and year from the date object
    let day = today.getDate().toString().padStart(2, '0'); // Ensure two digits with leading zero if necessary
    let month = (today.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-indexed, so add 1
    let year = today.getFullYear();

    // Format the date string as "DD/MM/YYYY"
    return `${month}/${day}/${year}`;
  }

}
