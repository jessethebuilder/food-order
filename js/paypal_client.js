function PaypalClient(selector, paypal_id, total, sandbox){
  // Selector is for the element PayPal should be place on
  // Total can be an amount or a function.
  // Sandbox is a boolean
  this.selector = selector;
  this.total = total;
  this.env = sandbox ? 'sandbox' : 'production';

  var app = this;

  this.render = function(){
    if(this.env == 'sandbox'){
      var client = {'sandbox': paypal_id}
    } else {
      var client = {'production': paypal_id}
    }



    paypal.Button.render({
      env: this.env,
      client: client,
      commit: true,
      payment: function(data, actions) {
        return actions.payment.create({
          payment: {
            transactions: [
              {
                amount: { total: app.total(), currency: 'USD' }
              }
            ]
          }
        });
      },

      onAuthorize: function(data, actions) {
        return actions.payment.execute().then(function(payment) {
          console.log(payment);
        });
      }

    }, selector);
  }
}
