import { Component, HostListener, Input, IterableChanges, IterableDiffer, IterableDiffers, OnInit, AfterViewInit, DoCheck } from '@angular/core'
import { BaseInteractionService } from 'src/app/shared/services/base-interaction.service'

@Component({
    selector: 'transfer-table',
    templateUrl: './transfer-table.html',
    styleUrls: ['./transfer-table.css']
})

export class TransferTableComponent implements OnInit, AfterViewInit, DoCheck {

    // #region Variables

    @Input() records: any[]

    @Input() headers: any
    @Input() widths: any
    @Input() visibility: any
    @Input() justify: any
    @Input() fields: any

    currentRow = 0
    tableContainer: any
    table: any
    rowHeight = 0
    rowCount = 0
    checked = false
    checkedIds: string[] = []
    totalPersons = 0

    differences: IterableDiffer<any>;

    // #endregion

    constructor(private interactionService: BaseInteractionService, private iterableDiffers: IterableDiffers) { }

    @HostListener('keyup', ['$event']) onkeyup(event: { key: string; target: { getAttribute: { (arg0: string): void; (arg0: string): void } } }) {
        if (event.key === 'Enter') { this.sendRowToService() }
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { this.gotoRow(event.key) }
    }

    ngOnInit() {
        this.differences = this.iterableDiffers.find(this.records).create();
    }

    ngAfterViewInit() {
        this.initVariables()
    }

    ngDoCheck() {
        const changes: IterableChanges<any> = this.differences.diff(this.records);
        if (changes) {
            this.checked = false
        }
    }

    /**
     * Caller(s):
     *  Template - table
     *
     * Description:
     *  Toggles the checkbox and counts the persons for the selected checkboxes
     *
     * @param row
     */
    toggleCheckBox(row: number) {
        this.checkedIds = []
        this.totalPersons = 0
        this.table.rows[row].classList.toggle('checked')
        this.table.querySelectorAll('tr.checked').forEach((element: { childNodes: { innerText: string }[] }) => {
            this.checkedIds.push(element.childNodes[2].innerText)
            this.totalPersons += parseInt(element.childNodes[11].innerText, 10)
        })
        localStorage.setItem('selectedIds', JSON.stringify(this.checkedIds))
        this.interactionService.setCheckedTotalPersons(this.totalPersons)
    }

    /**
     * Caller(s):
     *  Template - table
     *
     * Description:
     *  If the first column is clicked, toggle the checkboxes and counts the persons for the selected checkboxes
     *
     * @param column
     */
    onHeaderClick(column: any) {
        if (column.toElement.cellIndex === 0) {
            this.checked = !this.checked
            this.checkedIds = []
            this.totalPersons = 0
            this.table.querySelectorAll('tbody tr').forEach((element: { classList: { add: (arg0: string) => void; remove: (arg0: string) => void }; childNodes: { innerText: string }[] }) => {
                if (this.checked) {
                    element.classList.add('checked')
                    this.checkedIds.push(element.childNodes[2].innerText)
                    this.totalPersons += parseInt(element.childNodes[11].innerText, 10)
                } else {
                    element.classList.remove('checked')
                }
            })
            localStorage.setItem('selectedIds', JSON.stringify(this.checkedIds))
            this.interactionService.setCheckedTotalPersons(this.totalPersons)
        }
    }

    /**
     * Caller(s):
     *  Template - table
     *
     * Description:
     *  Uses the DomChangeDirective to listen for DOM changes
     *
     * @param $event
     */
    onDomChange($event: Event) {
        document.getElementById('table-transfer-input').focus()
        this.gotoRow(1)
    }

    /**
     * Caller(s):
     *  Class - HostListener()
     *  Class - onDomChange()
     *  Template - gotoRow()
     *
     * Description:
     *  Highlights the next / previous row according to the arrow keys or highlights the clicked row
     *
     * @param key // The pressed key code or the line number to goto directly
     */
    private gotoRow(key: any) {
        if (!isNaN(key)) {
            this.unselectAllRows()
            this.selectRow(this.table, key)
        }
        if (key === 'ArrowUp' && this.currentRow > 1) {
            this.unselectRow()
            this.selectRow(this.table, 'up')
            if (!this.isRowIntoView(this.table.rows[this.currentRow], key)) {
                this.tableContainer.scrollTop = (this.currentRow - 1) * this.rowHeight
            }
        }
        if (key === 'ArrowDown' && this.currentRow < this.rowCount) {
            this.unselectRow()
            this.selectRow(this.table, 'down')
            if (!this.isRowIntoView(this.table.rows[this.currentRow], key)) {
                document.getElementById('transfer-' + this.currentRow.toString()).scrollIntoView({ block: 'end' })
            }
        }
    }

    /**
     * Caller(s):
     *  Class - ngAfterViewInit()
     *
     * Description:
     *  Initializes local variables
     */
    private initVariables() {
        this.table = document.getElementById('table-transfer')
        this.tableContainer = this.table.parentNode.parentNode
        this.rowHeight = 51
        this.rowCount = this.table.rows.length - 1
    }

    /**
     * Caller(s):
     *  Class - gotoRow()
     *
     * Description:
     *  Checks if the selected row is fully visible
     *
     * @param row
     * @param direction
     */
    private isRowIntoView(row: HTMLTableRowElement, direction: string) {
        const rowOffsetTop = row.offsetTop
        const scrollTop = this.tableContainer.scrollTop
        const rowTopPlusHeight = rowOffsetTop + row.offsetHeight
        const indexTopPlusHeight = scrollTop + this.tableContainer.offsetHeight
        if (direction === 'ArrowUp') {
            if (indexTopPlusHeight - rowOffsetTop + this.rowHeight < this.tableContainer.offsetHeight) {
                return true
            } else {
                return false
            }
        }
        if (direction === 'ArrowDown') {
            if (rowTopPlusHeight <= indexTopPlusHeight) {
                return true
            } else {
                return false
            }
        }
    }

    /**
     * Caller(s):
     *  Class - gotoRow()
     *
     * Description:
     *  Updates the currentRow variable and highlights
     *
     * @param table
     * @param direction
     */
    private selectRow(table: HTMLTableElement, direction: any) {
        if (!isNaN(direction)) {
            this.currentRow = parseInt(direction, 10)
            document.getElementById('table-transfer-input').focus()
        } else {
            if (direction === 'up') { this.currentRow-- }
            if (direction === 'down') { ++this.currentRow }
        }
        table.rows[this.currentRow].classList.add('selected')
    }

    /**
     * Caller(s):
     *  Class - HostListener()
     *
     * Description:
     *  Sends the selected row to the service so that the parent (list-transfer) can call the editRecord method
     */
    private sendRowToService() {
        this.interactionService.sendObject(this.records[this.currentRow - 1])
    }

    /**
     * Caller(s):
     *  Class - gotoRow()
     *
     * Description:
     *  Removes the 'selected' class from all rows
     */
    private unselectAllRows() {
        this.table.querySelectorAll('tr').forEach((element: { classList: { remove: (arg0: string) => void } }) => {
            element.classList.remove('selected')
        })
    }

    /**
     * Caller(s):
     *  Class - gotoRow()
     *
     * Description:
     *  Removes the 'selected' class from the current row
     */
    private unselectRow() {
        this.table.rows[this.currentRow].classList.remove('selected')
    }

}