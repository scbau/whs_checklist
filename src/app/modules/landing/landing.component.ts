import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    // if online
    // - check for version of local vs server
    // - if outdated data
    // -- download
    // -- store
    // -- show message
    // - if not outdated
    // -- show message
    // if offline
    // - show message

    // initialize indexeddb
  }

}
