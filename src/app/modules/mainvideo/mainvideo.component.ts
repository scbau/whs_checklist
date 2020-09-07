import { Component, OnInit, OnChanges } from '@angular/core';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';

@Component({
  selector: 'app-mainvideo',
  templateUrl: './mainvideo.component.html',
  styleUrls: ['./mainvideo.component.css']
})
export class MainVideoComponent implements OnInit {
  public strURL = 'https://d3sxk9pu7edmci.cloudfront.net/';

    data;

    public src = "";

    constructor(private router: Router, private activatedRoute: ActivatedRoute) { }

    ngOnChanges(): void {
        console.log('asdasdasdasdasdasd');
    }

    ngOnInit(): void {
        this.activatedRoute.data.subscribe(v => this.data = v);
        console.log(this.data);

        this.src = this.strURL + this.data.path + "/" + this.data.filename + "?ngsw-bypass=true";
    }
}


// https://d3sxk9pu7edmci.cloudfront.net/Supercharge+M6+R5+fix+iPad+.mp4