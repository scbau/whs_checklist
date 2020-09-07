import { Component, OnInit, OnChanges } from '@angular/core';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

import { MessageService } from '../../services/message/message.service';

@Component({
  selector: 'app-mainview',
  providers: [MessageService],
  templateUrl: './mainview.component.html',
  styleUrls: ['./mainview.component.css']
})
export class MainviewComponent implements OnInit {

  public pdfSrc = "../assets/pdf/scb/automotive.pdf";

  data;

  message: string;

  public slides = []

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private messageService: MessageService) { }

  ngOnChanges(): void {
    console.log('asdasdasdasdasdasd');
  }

  ngOnInit(): void {
    this.messageService.currentMessage.subscribe(message => this.message = message);

    this.activatedRoute.data.subscribe(v => this.data = v);
    
    console.log(this.data);

    this.messageService.changeMessage(this.data.title);

    this.pdfSrc = '../assets/pdf/' + this.data.path + '.pdf';
    console.log(this.pdfSrc);

    // uncomment to use carousel for slides
    /*var x = new Array(this.data.length);

    for (var i = 0; i < this.data.length; i++) {
      x[i] = { 'image':'./assets/img/brochures/' + this.data.path + '/' + (i+1).toString() + '.png' }
    }

    this.slides = x;*/
  }

}
