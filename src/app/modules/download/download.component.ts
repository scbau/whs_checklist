import { Component, OnInit } from '@angular/core';
import { FileService } from '../../services/file/file.service';
import { HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-download',
  templateUrl: './download.component.html',
  styleUrls: ['./download.component.css']
})
export class DownloadComponent implements OnInit {

    ngOnInit() { }

    title = 'Angular File Download';

    constructor(private fileService: FileService) { }

    download() {
        this.fileService.downloadFile().subscribe(response => {
            //let blob:any = new Blob([response.blob()], { type: 'text/json; charset=utf-8' });
            //const url= window.URL.createObjectURL(blob);
            //window.open(url);
            window.location.href = response.url;
            //fileSaver.saveAs(blob, 'employees.json');
        }), error => console.log('Error downloading the file'),
            () => console.info('File downloaded successfully');
    }

}