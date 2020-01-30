import { BehaviorSubject, Observable } from 'rxjs'
import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { map } from 'rxjs/operators'

@Injectable({ providedIn: 'root' })

export class AccountService {

    private loginUrl: string = "/api/token/login"
    private registerUrl: string = 'api/account/register'
    private userName = new BehaviorSubject<string>(localStorage.getItem('userName'))
    private displayName = new BehaviorSubject<string>(localStorage.getItem('displayName'))
    private userRole = new BehaviorSubject<string>(localStorage.getItem('userRole'))
    private loginStatus = new BehaviorSubject<boolean>(this.checkLoginStatus())

    constructor(private router: Router, private http: HttpClient) { }

    login(userName: string, password: string) {
        const grantType = "password"
        const result = this.http.post<any>(this.loginUrl, { userName, password, grantType }).pipe(
            map(result => {
                if (result && result.authToken.token) {
                    this.loginStatus.next(true)
                    localStorage.setItem('loginStatus', '1')
                    localStorage.setItem('jwt', result.authToken.token)
                    localStorage.setItem('userName', result.authToken.userName)
                    localStorage.setItem('displayName', result.authToken.displayName)
                    localStorage.setItem('expiration', result.authToken.expiration)
                    localStorage.setItem('userRole', result.authToken.roles)
                    localStorage.setItem('refreshToken', result.authToken.refresh_token)
                    this.userName.next(localStorage.getItem('userName'))
                    this.displayName.next(localStorage.getItem('displayName'))
                    this.userRole.next(localStorage.getItem('userRole'))
                }
                return result
            })
        )
        return result
    }

    logout() {
        this.loginStatus.next(false)
        localStorage.removeItem('jwt')
        localStorage.removeItem('userRole')
        localStorage.removeItem('userName')
        localStorage.removeItem('displayName')
        localStorage.removeItem('expiration')
        localStorage.setItem('loginStatus', '0')
        this.router.navigate(['/login'])
    }

    register(formData: any) {
        return this.http.post<any>(this.registerUrl, formData).pipe(
            map(result => {
                console.log('From the server', result)
            })
        )
    }

    getNewRefreshToken(): Observable<any> {
        let userName = localStorage.getItem('userName')
        let refreshToken = localStorage.getItem('refreshToken')
        const grantType = "refresh_token"
        console.log('Inside getNewRefreshToken function')
        return this.http.post<any>(this.loginUrl, { userName, refreshToken, grantType }).pipe(
            map(result => {
                console.log(result)
                if (result && result.authToken.token) {
                    this.loginStatus.next(true)
                    localStorage.setItem('loginStatus', '1')
                    localStorage.setItem('jwt', result.authToken.token)
                    localStorage.setItem('userName', result.authToken.userName)
                    localStorage.setItem('displayName', result.authToken.displayName)
                    localStorage.setItem('expiration', result.authToken.expiration)
                    localStorage.setItem('userRole', result.authToken.roles)
                    localStorage.setItem('refreshToken', result.authToken.refresh_token)
                }
                return <any>result
            })
        )
    }

    private checkLoginStatus(): boolean {
        var loginCookie = localStorage.getItem("loginStatus")
        if (loginCookie == "1") {
            if (localStorage.getItem('jwt') != null || localStorage.getItem('jwt') != undefined) {
                return true
            }
        }
        return false
    }

    get isLoggedIn() {
        return this.loginStatus.asObservable()
    }

    get currentDisplayName() {
        return this.displayName.asObservable()
    }

    get currentUserRole() {
        return this.userRole.asObservable()
    }

}
