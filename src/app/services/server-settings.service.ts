import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';

const CONFIG = {
  apiTestUrl: 'http://localhost:8080/',
  apiHerokuUrl: 'https://visits-backend.herokuapp.com/',
  // apiEC2Url: 'http://ec2-34-239-179-123.compute-1.amazonaws.com:8080/'
};

@Injectable()
export class ServerSettingsService {

  constructor() { }

  public getApiURL() {
    return CONFIG.apiHerokuUrl;
  }

}