import { KeyValue } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { League } from 'src/app/shared/nestris-org/league-system';

export interface TableRow {
  rank: number;
  username: string;
  userid: string;
  league: League;
  isOnline: boolean;
}


@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent {
  // An ordered list of rows, with each row containing a key for each attribute name
  @Input() rows: TableRow[] = [];

  @Input() sortByAttribute!: string;

  // A ordered map of attribute name to display name for each column on the table
  // Each TableRow should contain a key for each attribute name
  @Input() attributes: { [key: string]: string } = {};

  // A map of column attribute name to a function that takes in a numeric cell value and returns a color
  // Otherwise, text will be defaulted to white
  @Input() colorRules: { [key: string]: (value: number) => string } = {};

  // A map of column attribute name to a function that takes in a cell value and returns a formatted display string
  // Otherwise, the cell value will be displayed as is
  @Input() formatRules: { [key: string]: (value: any) => string } = {};

  // The row to highlight on the table, if it exists
  @Input() myID?: string;

  // Map of online userids to their status
  //@Input() onlineUserIDs: Map<string, OnlineUserStatus> | null = null;

  readonly HIGHEST_RANK = 200;

  // Preserve original property order
  originalOrder = (a: KeyValue<string,string>, b: KeyValue<string,string>): number => {
    return 0;
  }

  getRowAttribute(row: TableRow, attribute: string): any {
    const value = (row as any)[attribute];

    // Return formatted value if a format rule exists
    if (this.formatRules[attribute]) {
      return this.formatRules[attribute](value);
    }

    // Otherwise, return the value as is
    return value;
  }

  getCellColor(row: TableRow, attribute: string): string {
    const value = (row as any)[attribute];

    // Return color if a color rule exists
    if (this.colorRules[attribute]) {
      return this.colorRules[attribute](value);
    }

    // Otherwise, default to white
    return 'white';
  }


}
