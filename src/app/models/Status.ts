export interface StatusMaps {
    attendanceStatus: { [key: number]: string };
    shiftStatus: { [key: number]: string };
    shift: { [key: number]: string };
    shiftTiming: { [key: number]: string };
    roomOccupancyStatus: { [key: number]: string };
    roomMaintainanceStatus: { [key: number]: string };
    paymentStatus: { [key: number]: string };
    reservationStatus: { [key: number]: string };
    menuAvailabilityStatus: {[key: number]: string};
    orderStatus: {[key: number]:  string};
}