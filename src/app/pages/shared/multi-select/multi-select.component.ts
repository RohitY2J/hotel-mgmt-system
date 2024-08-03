import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, TemplateRef  } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-multi-select',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './multi-select.component.html',
  styleUrl: './multi-select.component.scss'
})
export class MultiSelectComponent implements OnInit {
  
  @Input({required: false}) customTemplate: TemplateRef<any> | null = null;
  dropdownOpen = false;
  options = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
  selectedOptions: string[] = [];
  searchTerm: string = '';
  filteredOptions: string[] = this.options;

  ngOnInit(): void {
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  toggleOption(option: string) {
    if (this.selectedOptions.includes(option)) {
      this.selectedOptions = this.selectedOptions.filter(o => o !== option);
    } else {
      this.selectedOptions.push(option);
    }
  }

  removeOption(option: string) {
    this.selectedOptions = this.selectedOptions.filter(o => o !== option);
  }

  isSelected(option: string): boolean {
    return this.selectedOptions.includes(option);
  }

  filterOptions() {
    this.filteredOptions = this.options.filter(option => option.toLowerCase().includes(this.searchTerm.toLowerCase()));
  }
}

