import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss'
})
export class PaginationComponent {
  @Input() page:number = 1;
  @Input() pageSize:number = 5;
  @Input() dataCount: number = 5;
  @Input() hasNoItems: boolean = false;

  @Output() callback = new EventEmitter<number>();

  nextButtonClicked(){
    this.page += 1;
    this.callback.emit(this.page);
  }

  previousButtonClicked(){
    if(this.page > 1){
      this.page -= 1;
      this.callback.emit(this.page);
    }
  }

}
