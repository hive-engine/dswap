import styles from "./market-maker-dashboard.module.css";


export class MarketMakerDashboard {
           private styles = styles;
           private page = 1;

         
           attached() {
               $(".toggle").click(function (e) {
                   e.preventDefault(); // The flicker is a codepen thing
                   $(this).toggleClass("toggle-on");
               });
           }
       }
