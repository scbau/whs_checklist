import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, NavigationStart, NavigationEnd } from '@angular/router';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';

import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';

import { MessageService } from '../../services/message/message.service';
import { AuthenticationService } from '../../services/auth/auth.service';

interface FoodNode {
    id: number,
    name: string,
    children?: FoodNode[],
    route?: string,
    selected?: boolean,
    subname?: string,
    role: string[]
}

var TREE_DATA: FoodNode[] = [
  {
    "id": 1,
    "name": "Scorecard",
    "route": "/dashboard",
    "role": ["admin"]
  },
  {
    "id": 2,
    "name": "Not Visited",
    "route": "/dashboard/not-visited",
    "role": ["admin"]
  },
  {
    "id": 3,
    "name": "Checklist Compliance",
    "role": ["admin", "stateAdmin", "entityAdmin"],
    "route": "/dashboard/checksheet",
    "children": [
      {
        "id": 31,
        "name": "Forklift Pre-start Checklist",
        "route": "/dashboard/checksheet/forklift",
        "role": ["admin", "stateAdmin", "entityAdmin"],
      },
      {
        "id": 32,
        "name": "VSR Pre-start Checklist",
        "route": "/dashboard/checksheet/vsr",
        "role": ["admin", "stateAdmin", "entityAdmin"]
      },
      {
        "id": 33,
        "name": "Warehouse Depot Checklist",
        "route": "/dashboard/checksheet/warehouse",
        "role": ["admin", "stateAdmin", "entityAdmin"],
      }
    ]
  },
  {
    "id": 4,
    "name": "Checklist Compliance",
    "role": ["storeAdmin"],
    "route": "/dashboard/checksheet",
    "children": [
      {
        "id": 41,
        "name": "Forklift Pre-start Checklist",
        "route": "/dashboard/checksheet/forklift",
        "role": ["storeAdmin"],
      },
      {
        "id": 42,
        "name": "Warehouse Depot Checklist",
        "route": "/dashboard/checksheet/warehouse",
        "role": ["storeAdmin"],
      }
    ]
  }
];

@Component({
    selector: 'app-sidebar',
    providers: [MessageService],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.css']
})

export class SidebarComponent implements OnInit, OnDestroy, AfterViewInit {
    navigationSubscription;

    currentUserExists = true;

    treeControl = new NestedTreeControl<FoodNode>(node => node.children);
    dataSource = new MatTreeNestedDataSource<FoodNode>();

    panelOpenState = true;
    navbarText: string = "";
    mobileQuery: MediaQueryList;
    router: Router;

    data;
    message;

    @ViewChild('tree') tree;

    getTitle(state, parent) {
      var data = [];
      if (parent && parent.snapshot.data && parent.snapshot.data.title) {
        data.push(parent.snapshot.data.title);
      }

      if (state && parent) {
        data.push(... this.getTitle(state, state.firstChild(parent)));
      }
      return data;
    }

    initialize(media, changeDetectorRef, iconRegistry, sanitizer) {

      this.currentUserExists = !!this.authService.currentUserValue;

      this.dataSource.data = TREE_DATA.filter((value, index, array) => {
        if (this.authService.currentUserValue) {
          /*if (value.children) {
            var temp = [];
            for (var item of value.children) {
              if (item.role.includes(this.authService.currentUserValue.role)) {
                temp.push(item);
              }
            }

            let holder = Object.assign({}, value);
            holder.children = temp;

            // value.children = temp;
            return holder.role.includes(this.authService.currentUserValue.role);
          }
          else */
            return value.role.includes(this.authService.currentUserValue.role);
        }
        else return false;
      });

      this.mobileQuery = media.matchMedia('(max-width: 600px)');
      this._mobileQueryListener = () => changeDetectorRef.detectChanges();
      this.mobileQuery.addListener(this._mobileQueryListener);

      iconRegistry.addSvgIcon(
        'menu',
        sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/menu.svg'));

      iconRegistry.addSvgIcon(
        'logout',
        sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/logout.svg'));
    }

    constructor(
        private titleService: Title,
        private _router: Router,
        private activatedRoute: ActivatedRoute,
        private messageService: MessageService,
        private authService: AuthenticationService,
        changeDetectorRef: ChangeDetectorRef, 
        media: MediaMatcher, 
        iconRegistry: MatIconRegistry, 
        sanitizer: DomSanitizer) {

      this.navigationSubscription = this._router.events.subscribe((e: any) => {
        // If it is a NavigationEnd event re-initalise the component
        if (e instanceof NavigationEnd) {
          // this.currentUserExists = !!this.authService.currentUserValue;
          this.initialize(media, changeDetectorRef, iconRegistry, sanitizer);

          var title = this.getTitle(_router.routerState, _router.routerState.root).join('-');
          console.log('title', title);
          titleService.setTitle(title);

          this.navbarText = title;
        }
      });

      this.initialize(media, changeDetectorRef, iconRegistry, sanitizer);

      this.router = _router;

    }

    hasChild = (_: number, node: FoodNode) => !!node.children && node.children.length > 0;
    private _mobileQueryListener: () => void;

    ngOnInit() {
      console.log("life: OnInit");
      // console.log(this.authService.currentUserValue.role);
        this.currentUserExists = !!this.authService.currentUserValue;
        // this.getHeroes();
        this.messageService.currentMessage.subscribe(message => { this.navbarText = message; console.log(message); });

      if (this.data)
        this.navbarText = this.data.title;
      else
        this.navbarText = "";
    }

    getUserDisplay() {
      if (this.authService.currentUserValue) {
        return this.authService.currentUserValue.lastName + ", " + this.authService.currentUserValue.firstName;
      }
    }

    ngAfterViewInit() {
      // this.tree.treeControl.expandAll();

      console.log("life: AfterViewInit");
      this.currentUserExists = !!this.authService.currentUserValue;
    }

    ngOnDestroy(): void {
      console.log("life: OnDestroy");
      this.mobileQuery.removeListener(this._mobileQueryListener);
      this.currentUserExists = !!this.authService.currentUserValue;
      if (this.navigationSubscription) {
        this.navigationSubscription.unsubscribe();
      }
    }

    isUserAdmin(): boolean {
      if (this.authService.currentUserValue)
        return this.authService.currentUserValue.role == "admin";
      else return false;
    }

    hasAccess(node): boolean {
      if (this.authService.currentUserValue)
        return node.role.includes(this.authService.currentUserValue.role);
      else return false;
    }

    changeRoute(node: FoodNode): void {
        this.navbarText = node.name;

        this.router.navigateByUrl(node.route);
    }

    openSettings(): void {
      this.navbarText = "Settings";
      this.router.navigateByUrl('dashboard/settings');
    }

    public setTitle(text: string): void {
        this.navbarText = text;
    }

    logout(): void {
      this.currentUserExists = false;
      this.authService.logout();
      this.navbarText = "";
      console.log("Logout!")
      this.router.navigateByUrl('login');
    }
}
