import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'app-autocomplete',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './autocomplete.component.html',
  styleUrl: './autocomplete.component.scss'
})
export class AutocompleteComponent {

  @Input() filteredOptions: string[] = [];
  @Output() callback = new EventEmitter<string>(); 

  @Input() searchControl = new FormControl();
  
  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe(async value => {
      this.callback.emit(value);
      //this.filteredOptions = await this.filterOptions(value);
    });
  }

  async filterOptions(value: string): Promise<string[]> {
    const filterValue = value.toLowerCase();
    try {
       // const res: any = await this.httpService.httpPost(`menu/getMenuName`, { query: filterValue }).toPromise();
        //return res.data || [];
    } catch (err) {
    }
    return [];
  }

  selectOption(option: string) {
    this.searchControl.setValue(option, { emitEvent: false });
    this.filteredOptions = [];
  }
}
