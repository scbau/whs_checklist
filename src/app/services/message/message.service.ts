import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class MessageService {

    private messageSource = new BehaviorSubject('');
    currentMessage = this.messageSource.asObservable();

    constructor() { }

    changeMessage(message: string) {
        console.log(message);
        this.messageSource.next(message)
    }

}