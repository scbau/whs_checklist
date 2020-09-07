import { Injectable } from '@angular/core';
import { openDB } from 'idb';
import { Observable, from, Subject } from 'rxjs';
import { Video } from '../../models/video';

const VID_DB_NAME = 'vidDB';
const VID_STORE_NAME = 'videos';

@Injectable({
  providedIn: 'root'
})
export class PersistenceService {
  private _dataChange: Subject<Video> = new Subject<Video>();
  private _dbPromise;

  constructor() { }

  connectToIDB() {
    this._dbPromise = openDB('pwa-database', 1, {
    	upgrade(db) {
        db.createObjectStore(VID_STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true
        });
    	}
    });
  }

  addItems(target: string, value: Video) {
    this._dbPromise.then((db: any) => {
      const tx = db.transaction(target, 'readwrite');
      tx.objectStore(target).put({
        path: value.path,
        downloaded: value.downloaded,
        data: value.data
      });
      this.getAllData(VID_STORE_NAME).then((items: Video) => {
        this._dataChange.next(items);
      });
      return tx.complete;
    });
  }

  deleteItems(target: string, value: Video) {
    this._dbPromise.then((db: any) => {
      const tx = db.transaction(target, 'readwrite');
      const store = tx.objectStore(target);
      store.delete(value);
      this.getAllData(target).then((items: Video) => {
        this._dataChange.next(items);
      });
    });
  }

  getAllData(target: string) {
    return this._dbPromise.then((db: any) => {
      const tx = db.transaction(target, 'readonly');
      const store = tx.objectStore(target);
      return store.getAll();
    });
  }

  dataChanged(): Observable<Video> {
    return this._dataChange;
  }

	private vidDB;

	async connect(): Promise<void> {
		this.vidDB = await openDB(VID_DB_NAME, 2, {
			upgrade(db) {
				db.createObjectStore(VID_STORE_NAME, {
					keyPath: 'id',
					autoIncrement: true
				});
			},
		});
	}

	getAll(storeName: string): Observable<any> {
		return from(this.vidDB.getAll(storeName));
	}

	save(storeName: string, item: any): Observable<any> {
		return from(this.vidDB.put(storeName, item));
	}

  // constructor() { }
}
