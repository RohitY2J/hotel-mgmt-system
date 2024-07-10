import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IDropdownSettings, NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-waiter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgMultiSelectDropDownModule,
    NgSelectModule
  ],
  templateUrl: './waiter.component.html',
  styleUrl: './waiter.component.scss'
})
export class WaiterComponent implements OnInit {
  allMenus: any[] = [{
    tableNumber: 5,
    name: "Test",
    price: 500,
  }, {
    tableNumber: 5,
    name: "Test",
    price: 500,
  }, {
    tableNumber: 5,
    name: "Test",
    price: 500,
  }, {
    tableNumber: 5,
    name: "Test",
    price: 500,
  }, {
    tableNumber: 5,
    name: "Test",
    price: 500,
  }, {
    tableNumber: 5,
    name: "Test",
    price: 500,
  }
  ]

  dropdownList: any[] = []

  isOrderFormOpen: boolean = true;
  orderForm: FormGroup = new FormGroup({})
  dropdownSettings: IDropdownSettings = {};

  selectedItems: any[] = [];

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.orderForm = this.fb.group({
      tableNumber: new FormControl('', Validators.required),
      items: new FormControl([], Validators.required),
      //status: new FormControl('')
    })

    this.orderForm.setValue({
      tableNumber: '1',
      items: [ 'hello',
        { item_id: 1, item_text: 'Item 1', city: 'New York', initials: 'NY' }
      ]
    })

    this.dropdownList = [
      { item_id: 1, item_text: 'Item 1', city: 'New York', initials: 'NY' },
      { item_id: 2, item_text: 'Item 2', city: 'Los Angeles', initials: 'LA' },
      { item_id: 3, item_text: 'Item 3', city: 'Chicago', initials: 'CHI' },
      { item_id: 4, item_text: 'Item 4', city: 'Houston', initials: 'HOU' },
      { item_id: 5, item_text: 'Item 5', city: 'Phoenix', initials: 'PHX' }
    ];

    this.dropdownSettings = {
      singleSelection: false,
      idField: "item_id",
      textField: "item_text",
      selectAllText: "Select All",
      unSelectAllText: "UnSelect All",
      itemsShowLimit: 3,
      allowSearchFilter: true
    };

    this.dropdownSettings = {
      singleSelection: false,
      idField: 'item_id',
      textField: 'item_text',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 3,
      allowSearchFilter: true
    };
  }

  get getItems() {
    return this.dropdownList.reduce((acc, curr) => {
      acc[curr.item_id] = curr;
      return acc;
    }, {});
  }

  addOrder() {
    this.isOrderFormOpen = true;
  }


  closeModal() {
    this.isOrderFormOpen = false;
  }

  onSubmit() {
    this.closeModal();
  }

  openUpdateForm(menu: any) {

  }

  onItemSelect(item: any) {
    console.log(item);
  }
  onSelectAll(items: any) {
    console.log(items);
  }
}
