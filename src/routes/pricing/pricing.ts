import styles from "./pricing.module.css";

export class Faq {
  private styles = styles;

  
  // FAQ Displays
  handleClick(e) {
    $(".faq-content").css("display", "none");
    $("#faq" + e + "Content").css("display", "block");
    // $('.faq-item' + e ).addClass('active');
    // $('.faq-items').removeClass('active');
  }
}
