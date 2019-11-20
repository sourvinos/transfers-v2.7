import { SelectionModel } from '@angular/cdk/collections'
import { Component, OnDestroy, OnInit } from '@angular/core'
import { MatTableDataSource } from '@angular/material'
import { ActivatedRoute, Router } from '@angular/router'
import { ICustomer } from '../models/customer'
import { KeyboardShortcuts, Unlisten } from '../services/keyboard-shortcuts.service'
import { Utils } from '../shared/classes/utils'

@Component({
    selector: 'app-customer-list',
    templateUrl: './customer-list.component.html',
    styleUrls: ['../shared/styles/lists.css']
})

export class CustomerListComponent implements OnInit, OnDestroy {

    // #region Init

    date: string = ''

    customers: ICustomer[]
    filteredCustomers: ICustomer[]

    columns = ['id', 'description', 'address', 'phones', 'email']
    fields = ['Id', 'Description', 'Address', 'Phones', 'Email']
    format = ['', '', '', '', '']
    align = ['center', 'left', 'left', 'left', 'left']

    unlisten: Unlisten

    dataSource: MatTableDataSource<ICustomer>
    selection: SelectionModel<[]>

    selectedElement = []

    // #endregion

    constructor(private keyboardShortcutsService: KeyboardShortcuts, private router: Router, private route: ActivatedRoute) {
        this.customers = this.route.snapshot.data['customerList']
        this.filteredCustomers = this.customers
        this.dataSource = new MatTableDataSource<ICustomer>(this.filteredCustomers)
        this.selection = new SelectionModel<[]>(false)
        this.unlisten = null
    }

    ngOnInit() {
        this.addShortcuts()
        this.setFocus('searchField')
    }

    ngOnDestroy() {
        (this.unlisten) && this.unlisten()
    }

    // T
    editRecord() {
        this.router.navigate(['/customers/', document.querySelector('.mat-row.selected').children[0].textContent])
    }

    // T
    newRecord() {
        this.router.navigate(['/customers/new'])
    }

    // T
    filter(query: string) {
        this.dataSource.data = query ? this.customers.filter(p => p.description.toLowerCase().includes(query.toLowerCase())) : this.customers
    }

    private addShortcuts() {
        this.unlisten = this.keyboardShortcutsService.listen({
            "Enter": (event: KeyboardEvent): void => {
                this.editRecord()
            },
            "Alt.N": (event: KeyboardEvent): void => {
                event.preventDefault()
                document.getElementById('new').click()
            }
        }, {
            priority: 1,
            inputs: true
        })
    }

    private setFocus(element: string) {
        Utils.setFocus(element)
    }

}
