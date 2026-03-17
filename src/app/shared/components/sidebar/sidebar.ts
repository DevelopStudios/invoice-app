import { Component } from '@angular/core';
import { ThemeToggle } from "../theme-toggle/theme-toggle";

@Component({
  selector: 'app-sidebar',
  imports: [ThemeToggle],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {

}
