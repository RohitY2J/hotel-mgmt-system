import { Component } from '@angular/core';
import { MultiSelectComponent } from '../shared/multi-select/multi-select.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [MultiSelectComponent, CommonModule],
  templateUrl: './example.component.html',
  styleUrl: './example.component.scss'
})
export class ExampleComponent {
  customOptionTemplate = true;
  selectedOptions: string[] = [];
  options = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
  isSelected(option: string): boolean {
    return this.selectedOptions.includes(option);
  }
  toggleOption(option: string) {
    if (this.selectedOptions.includes(option)) {
      this.selectedOptions = this.selectedOptions.filter(o => o !== option);
    } else {
      this.selectedOptions.push(option);
    }
  } 
}
