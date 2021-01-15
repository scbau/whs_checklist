import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import * as moment from 'moment';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Router, NavigationEnd } from '@angular/router';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ErrorStateMatcher } from '@angular/material/core';

import { FormationService } from '../../services/checklist/formation.service';
import { AuthenticationService } from '../../services/auth/auth.service';
// import { UiService } from '../../services/overlay/ui.service'

import { FormControl, FormGroup, FormGroupDirective, NgForm, Validators } from '@angular/forms';

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

export interface FormationData {
  checklist: string;
  equipmentLocation: string;
  lineNumber: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  details: [object];
}

export interface PeriodData {
  displayValue: string;
}

const LAST_YEARS = 2;

var currentWeek = {
  value: "",
  end: "",
  displayValue: "",
  dateView: ""
};

var WEEKLY = (function() {
  var options = [];
  var start = new Date(Date.now()).getFullYear();
  for (var i = LAST_YEARS; i >= 0; i--) {
    var startYear = start - i;
    var startDate = moment(new Date(startYear, 0, 1));

    if (startDate.date() == 8) {
      startDate = startDate.isoWeekday(-6);
    }

    var today = moment(new Date(startYear, 11, 31)).isoWeekday('Sunday');
    while (startDate.isBefore(today)) {
      let startDateWeek = startDate.isoWeekday('Monday').format('DD-MM-YYYY');
      let startDateISO = startDate.toISOString();

      let endDateWeek = startDate.isoWeekday('Sunday').format('DD-MM-YYYY');
      let endDateISO = startDate.toISOString();

      var end = new Date(endDateISO);
      end.setDate(end.getDate() + 1);
      end.setMilliseconds(end.getMilliseconds() - 1);

      startDate.add(7, 'days');
      var item = {
        value: startDateISO,
        end: end.toISOString(),
        displayValue: startDateWeek + " to " + endDateWeek,
        dateView: startDateWeek + " to " + endDateWeek
      };

      if (moment().isBetween(moment(startDateISO), moment(endDateISO), undefined, '[]')) { // 6/15 0:00:00 to 6/21   0:00:00
        currentWeek = item;
        console.log(currentWeek);
      }
      options.push(item);
    }
  }

  // console.log(options);

  return options;
})();

const CHECKLIST_OPTIONS = [
  {
    value: 'acidFiller',
    displayValue: 'Acid Filler',
    periodOptions: WEEKLY,
  },
  {
    value: 'charging',
    displayValue: 'Charging',
    periodOptions: WEEKLY,
  },
  {
    value: 'hrdbrusher',
    displayValue: 'HRD Brusher',
    periodOptions: WEEKLY,
  },
  {
    value: 'unloader',
    displayValue: 'Unloader',
    periodOptions: WEEKLY,
  },
]


@Component({
  selector: 'app-dashboard',
  templateUrl: './summary.component.html',
  styleUrls: ['./formation.component.css']
})
export class SummaryComponent implements OnInit, AfterViewInit, OnDestroy {

  dateView = "";

  range = new FormGroup({
    start: new FormControl(new Date()),
    end: new FormControl(new Date())
  });

  navigationSubscription;

  currentUserRole = 'all';
  // currentUserState = 'all';

  // expectedCheckCount = 0;
  isLoading = false;

  options = new FormControl('valid', [
    Validators.required,
  ]);
  optionsDaily = new FormControl('valid', [
    Validators.required,
  ]);
  matcher = new MyErrorStateMatcher();
  matcherDaily = new MyErrorStateMatcher();

  displayedColumns: string[] = [/*'weekNumber', */'equipmentLocation', 'lineNumber', 'mon', 'tue', 'wed', 'thu', 'fri', 'details'];
  displayedOptionColumns: string[] = ['period', 'close'];
  dataSource = new MatTableDataSource<FormationData>([]);

  @ViewChild('paginator') paginator: MatPaginator;
  @ViewChild('paginator2') paginator2: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  // public selectedOption = [currentWeek];
  // public selectedOption = [CHECKLIST_OPTIONS[0].periodOptions[0]];
  // selectedOptionDaily = DAILY[0];
  selectedOptionDaily = currentWeek;
  // optionSource = new MatTableDataSource<PeriodData>(this.selectedOption);
  public selectedChecklist = CHECKLIST_OPTIONS[0];

  // data array
  currentElementData = [];

  // filter options array 
  periods = CHECKLIST_OPTIONS[0].periodOptions;
  checklists = CHECKLIST_OPTIONS;

  // paginator size options
  pageSizeOptions = [10, 20, 40, 100];

  // constructor(private checklistService: ChecklistService, private ui: UiService) { }
  constructor(private formationService: FormationService, private authService: AuthenticationService, private router: Router) {
    this.navigationSubscription = this.router.events.subscribe((e: any) => {
      // If it is a NavigationEnd event re-initalise the component
      if (e instanceof NavigationEnd) {
        this.initialize();
      }
    });
  }

  initialize() {
    var currentUser = this.authService.currentUserValue;
    console.log(currentUser);
    if (currentUser) {
      if (currentUser.role == 'admin') {
        this.currentUserRole = 'all';
        // this.currentUserState = 'all';
      }
      else if (currentUser.role == 'stateAdmin') {
        this.currentUserRole = 'state';
        // this.currentUserState = currentUser.state;
        // this.selectedState = this.currentUserState;
      }
      else if (currentUser.role == 'entityAdmin') {
        this.currentUserRole = 'entity';
        // this.currentUserState = currentUser.state;
        // TODO: find a way to limit selection to states of entity (see master excel sheet for list of states per entity)
      }
    }
    this.fetchData();
    this.dateView = this.getDateView();
    // this.updateDataSource(this.currentElementData);
  }

  ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  ngAfterViewInit(): void {
    // console.log("life: AfterViewInit");
    // this.fetchData();
  }

  ngOnInit(): void {
    // console.log("life: OnInit");
    var currentUser = this.authService.currentUserValue;
    console.log(currentUser);
    if (currentUser) {
      if (currentUser.role == 'admin') {
        this.currentUserRole = 'all';
        // this.currentUserState = 'all';
      }
      else if (currentUser.role == 'stateAdmin') {
        this.currentUserRole = 'state';
        // this.currentUserState = currentUser.state;
        // this.selectedState = this.currentUserState;
      }
      else if (currentUser.role == 'entityAdmin') {
        this.currentUserRole = 'entity';
        // this.currentUserState = currentUser.state;
        // TODO: find a way to limit selection to states of entity (see master excel sheet for list of states per entity)
      }
    }
    // this.updateDataSource(this.currentElementData);
  }

  // filter checklist type (daily, weekly, monthly, biannually)
  filterChecklist(data) {
    this.periods = data.value.periodOptions;
    var tempArray = [];

    tempArray.push(currentWeek);

    // this.updateOptionSource(tempArray);
    this.fetchData();
  }

  filterOptionList(data) {
    console.log(data);
    // this.optionSource = new MatTableDataSource<PeriodData>(this.selectedOption);
    // this.optionSource.paginator = this.paginator2;
  }

  // private updateOptionSource(optionList) {
    // this.selectedOption = optionList;
    // this.optionSource = new MatTableDataSource<PeriodData>(this.selectedOption);
    // this.optionSource.paginator = this.paginator2;
  // }

  private updateDataSource(dataList) {
    console.log(dataList);
    this.currentElementData = dataList;
    
    var tempArray = [];
    tempArray = this.currentElementData;
    
    this.dataSource = new MatTableDataSource<FormationData>(tempArray);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.pageSizeOptions[3] = this.currentElementData.length;
    this.dateView = this.getDateView();
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  // removeOption(data) {
    // var tempArray = this.selectedOption.filter(function(value, index, arr) {
      // return value.value != data.value;
    // });

    // this.updateOptionSource(tempArray);
  // }

  // query data
  fetchData() {
    console.log("!!!!!")
    // handle what type of checklist is displayed and must update date range default value
    this.isLoading = true;
    var params = [];

    if (this.selectedOptionDaily.value == 'Custom') {
      var start = new Date(this.range.value.start.toISOString());
      start.setHours(0, 0, 0, 0);
      var end = new Date(this.range.value.end.toISOString());
      end.setHours(23, 59, 59, 999);
      params.push({
        from: start.toISOString(),
        to: end.toISOString()
      });
    }
    else {
      params.push({ from: this.selectedOptionDaily.value, to: this.selectedOptionDaily.end });
    }

    console.log(this.selectedChecklist.value);

    // change this to selectedChecklist.value
    this.formationService.fetchData(this.selectedChecklist.value, params)
      .subscribe((data: any) => {
        console.log(data);

        var result = [];

        var arrayData = data.data;
        console.log(arrayData);

        for (var item of arrayData) {
          if (!item.active) {
            continue;
          }

          var row = {};
          row["equipmentLocation"] = item.equipmentLocation;
          row["lineNumber"] = item.line;

          console.log(item);

          if (item.hasOwnProperty("items")) {

            // console.log()

            var row1 = { ...row };
            var items = item.items
            // row["weekNumber"] = items.weekNumber;
            for (var key in items) {
              console.log(items[key]);
              // row1["weekNumber"] = key;
              row1["details"] = items[key];

              // var row2 = { ...row1 };
              for (var day in items[key]) {
                row1[this.convertNumberToDay(day)] = this.identifyDayCheck(items[key][day]);
              }

              result.push(row1);
            }
          }
          else {
            // row = {};
            result.push(row);
          }

        }

        // displayedColumns: string[] = ['weekNumber', 'equipmentLocation', 'lineNumber', 'mon', 'tue', 'wed', 'thu', 'fri', 'details'];

        /*for (var key in arrayData) {
          console.log(key);
          var item = arrayData[key];

          var row = {};
          row["weekNumber"] = key;

          for (var equipmentLocation in item) {
            var row1 = { ...row };
            console.log(equipmentLocation);
            var line = item[equipmentLocation];
            row1["equipmentLocation"] = equipmentLocation;

            for (var lineNumber in line) {
              var row2 = { ...row1 };
              console.log(lineNumber);
              row2["lineNumber"] = lineNumber;
              row2["mon"] = this.identifyDayCheck(line[lineNumber][1]);
              row2["tue"] = this.identifyDayCheck(line[lineNumber][2]);
              row2["wed"] = this.identifyDayCheck(line[lineNumber][3]);
              row2["thu"] = this.identifyDayCheck(line[lineNumber][4]);
              row2["fri"] = this.identifyDayCheck(line[lineNumber][5]);
              row2["details"] = line[lineNumber];
              result.push(row2);
            }
          }
        }*/

        this.updateDataSource(result);
      });
  }

  private convertNumberToDay(number) {
    var lookup = {
      1: "mon",
      2: "tue",
      3: "wed",
      4: "thu",
      5: "fri"
    };
    console.log(lookup[number]);
    return lookup[number];
  }

  public identifyDayCheck(entry) {
    if (Object.keys(entry).length == 0) {
      // empty
      return "";
    }
    else {
      if (entry.failCount == 0) {
        // all pass
        return "pass";
      }
      else {
        // failed
        return "fail";
      }
    }
  }

  getDateView() {
    console.log(this.selectedOptionDaily);
    /*if (this.selectedOption.length > 1) {
      var items = [];
      for (var option of this.selectedOption) {
        items.push(option.dateView);
      }

      // if (item)
      return items[0] + ` (+${items.length - 1} ${items.length === 2 ? 'other' : 'others'})`;
    }*/
    // else {
      console.log("selectedOption.length <= 1")
      return this.selectedOptionDaily.dateView;
    // }
  }

  isUpdateButtonDisabled() {
    if (this.selectedChecklist.value != "daily") {
      return this.options.value?.length == 0;
    }
    else {
      if (this.selectedOptionDaily.value == 'Custom') {
        return !this.range.value.start || !this.range.value.end
      }
    }
  }

  resetPeriodFilter() {

    var data = this.selectedChecklist, tempArray = [];

    tempArray.push(currentWeek);
    this.selectedOptionDaily = currentWeek;

    /*if (data.value == "daily") { // daily checklist handler
      this.selectedOptionDaily = DAILY[0];
    }
    else if (data.value == "monthly") { // monthly checklist handler
      tempArray.push(data.periodOptions[(LAST_YEARS * 12) + new Date().getMonth()]);
    }
    else if (data.value == "maintenance") { // biannually checklist handler
      // tempArray.push(data.periodOptions[data.periodOptions.length - 1]);
      this.selectedOptionDaily = MAINTENANCE[0];
    }*/

    // this.updateOptionSource(tempArray);
    this.fetchData();
  }


  generateData(entry) {
    console.log(entry);

    var doc = new jsPDF('portrait', 'pt', 'a4');

    // autoTable(doc, { head: [[`${this.selectedChecklist.displayValue} VSR Pre-start Checklist`]] });

    var vsr = [];
    // vsr.push(["Checklist:", `${this.selectedChecklist.displayValue} VSR Pre-start Checklist`]);
    vsr.push(["Date Generated:", `${(new Date()).toLocaleString("en-AU")}`]);
    vsr.push(["SLOC:", entry.vehicle]);
    vsr.push(["Dates:", this.dateView]);
    vsr.push(["Expected Check Count:", entry.expectedCheckCount]);
    vsr.push(["Times Checked: ", entry.timesChecked]);

    autoTable(doc, { head: [[`${this.selectedChecklist.displayValue} VSR Pre-start Checklist`, '']], body: vsr });

    var criticalItems = [];
    var checklist = [];
    var extras = [];

    for (var item of entry.data) {
      // var details = [];
      // details.push(["Date:", item.date]);

      if (item.criticalInstances.length > 0) {
        criticalItems.push(item.criticalInstances);
      }


      var date = new Date(item.date);

      var col = [[`Checklist (${date.toLocaleDateString("en-AU")})`, "Pass / Fail / N/A", "Action Needed"]]
      var rows = [];

      for (var i = 0; i < item.answers.length; i++) {
        var temp = [item.questionDetails[i], item.answers[i], item.comments[i]];
        rows.push(temp);
      }

      checklist.push({
        head: col,
        body: rows,
        didDrawPage: (data) => {
          console.log(data);
        }
      });

      /*autoTable(doc, {
        head: col,
        body: rows,
        didDrawPage: (data) => {
          // console.log(data);
        }
      });*/

      var extra = [];
      var otherComment = ""

      if (item.otherComment) {
        otherComment = item.otherComment;
      }
      extra.push(["Odometer Reading:", item.odometerReading])
      extra.push(["Other Comments:", otherComment])
      extra.push(["Driver:", item.employee])

      /*autoTable(doc, {
        margin: { bottom: 10 },
        head: [],
        body: extra
      });*/

      extras.push({
        margin: { bottom: 10 },
        head: [],
        body: extra
      });
    }

    if (criticalItems.length > 0) {
      autoTable(doc, {
        head: [["Date", "Items"]],
        body: criticalItems
      });
    }

    for (var i = 0; i < checklist.length; i++) {
      autoTable(doc, checklist[i]);
      autoTable(doc, extras[i]);
      if (i < checklist.length-1) doc.addPage();
    }

    /*for (var check of extras) {
      autoTable
    }*/

    doc.save(`(VSR-${this.selectedChecklist.displayValue[0]}) ${entry.vehicle} (${this.dateView})`);
  }
}
