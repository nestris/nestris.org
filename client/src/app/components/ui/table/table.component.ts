import { KeyValue } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';

export interface TableRow {
  username: string;
  userid: string;
}

export interface RankedTableRow extends TableRow {
  _rank: number;
}

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnChanges {
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

  sortedRows: RankedTableRow[] = [];

  readonly HIGHEST_RANK = 200;

  // On changes, recalculate ranking from rows. If two players have same elo, they will share same rank,
  // but the next rank will be skipped.
  ngOnChanges(): void {

    this.sortedRows = [];
    let currentRank = 1;

    let rows: any[] = this.rows;

    // Sort rows by sortByAttribute, descending
    rows = rows.sort((a, b) => b[this.sortByAttribute] - a[this.sortByAttribute]);

    // Calculate ranking
    let duplicateRank = 0;
    for (let i = 0; i < this.rows.length; i++) {
      if (i == 0) {}
      else if (rows[i][this.sortByAttribute] !== rows[i - 1][this.sortByAttribute]) {
        currentRank += 1 + duplicateRank;
        duplicateRank = 0;
      } else duplicateRank++;

      if (currentRank > this.HIGHEST_RANK) break;

      this.sortedRows.push({
        ...rows[i],
        _rank: currentRank
      });
    }

    console.log('TableComponent: ngOnChanges() - sortedRows:', this.sortedRows);
  }


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

  // getOnlineStatus(userid: string): OnlineUserStatus {
  //   if (!this.onlineUserIDs) {
  //     return OnlineUserStatus.OFFLINE;
  //   }

  //   return this.onlineUserIDs.has(userid) ? this.onlineUserIDs.get(userid)! : OnlineUserStatus.OFFLINE;
  // }

}
