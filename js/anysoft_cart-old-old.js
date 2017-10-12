function AnysoftCart(){
  var app = this;

  $.ajax({
    method: 'GET',
    url: 'js/templates.ejs',
    complete: function(response){
      $('body').append(response.responseText);

      var Order = Backbone.Model.extend({
        localStorage: new Backbone.LocalStorage('anysoft_cart_order_storage'),
        initialize: function(){
          this.set({order_items: new OrderItems()});
        },
        add: function(name, price){
          var o = new OrderItem({name: name, price: price});
          this.get('order_items').add(o);
        },
        // localStorage: new Backbone.LocalStorage('anysoft_cart_order_storage'),
        complete: function(){
          this.sync({
            ajaxSync: true
          });
        },
        total: function(){
          var total = 0;
          this.get('order_items').each(function(oi){
            total += oi.get('price') * oi.get('quantity');
          });

          return total;
        },
        length: function(){
          return this.get('order_items').length;
        }
      })

      var OrderItem = Backbone.Model.extend({
        defaults: {
          name: null,
          price: null,
          quantity: 1
        }
      });

      var OrderItems = Backbone.Collection.extend({
        model: OrderItem,

      });

      var OrderItemView = Backbone.View.extend({
        model: OrderItem,
        template: _.template($('#anysoft_cart_order_item_template').html()),
        events: {
          'click .remove_from_cart': 'removeFromCart',
        },
        initialize: function(){
          this.listenTo(this.model, 'destroy', this.remove);
        },
        removeFromCart: function(){
          this.model.destroy();
        },
        render: function(){
          this.$el.html(this.template(this.model.toJSON()));
          return this;
        }
      });

      var OrderItemsView = Backbone.View.extend({

      });

      var OrderView = Backbone.View.extend({
        model: Order,
        el: $('#anysoft_cart_order'),
        template: _.template($('#anysoft_cart_order_template').html()),
        initialize: function(){
          // _.bindAll(this, 'addOrderItem');
          // _.bindAll(this, 'updateOrder');
          //
          this.listenTo(app.order.get('order_items'), 'add', this.addOrderItem);
          this.listenTo(app.order.get('order_items'), 'all', this.updateOrder);
        },
        addOrderItem: function(order_item){
          var view = new OrderItemView({model: order_item});
          this.$el.find('.order_item_list').append(view.render().$el);
        },
        updateOrder: function(){
          this.init();
        },
        init: function(){
          this.$el.find('.order_total').text(this.model.total());
          this.$el.find('.order_item_count').text(this.model.length());
          // show/hide the order, depending on whether there is any OrderItems
          this.model.length > 0 ? this.$el.show() : this.$el.hide();
        },
        events: {
          'click .complete': 'completeOrder',
          'click .destroy': 'destroyOrder'
        },
        completeOrder: function(){
          app.router.navigate('checkout', {trigger: true});
        },
        submitOrder: function(){
          var order = {order_items: []};
          $(this.collection.models).each(function(i, oi){
            order.order_items.push(oi.toJSON());
          });

          $.ajax({
            method: 'POST',
            url: app.order_endpoint,
            data: order
          });
        },
        destroyOrder: function(){
          $(this.collection.models).each(function(i, oi){
            oi.destroy();
          });
        },
        render: function(){
          this.$el.html(this.template);
          var list = this.$el.find('.order_item_list');
          this.model.get('order_items').each(function(order_item){
            var view = new OrderItemView({model: order_item});
            list.append(view.render().$el);
          });

          this.init();
          return this;
        }
      }); // end OrderView

      //--- Checkout ----------------------------------------------------------------------

      var CheckoutView = Backbone.View.extend({
        el: $('#anysoft_cart_order'),
        template: _.template($('#anysoft_cart_checkout_template').html()),
        initialize: function(){

        },
        events: {
          'click .continue': 'continueOrder'
        },
        continueOrder: function(){
          app.router.navigate('', {trigger: true});
        },
        render: function(){
          this.$el.html(this.template);
          var pc = new PaypalClient('#complete_anysoft_cart',
          'AU14Gxf9Wt83SYZbTVDjPWvAz2zXgnkhLJR7jPd_B-LHdvNmBDJ35o9s3iALfdVPJSqOhcMlLYhdcqr-',
          function(){
            return app.order.total().toFixed(2);
          },
          true);
          pc.render();
        }
      });

      //--- Products --------------------------------------------------------------
      // Products are only a vew that speak with Order

      app.init = function(){
        const t = this;

        t.order = new Order;
        t.order.fetch().then(function(){
          app.view = new OrderView({model: t.order});
          return new Promise(function(resolve, reject){
            resolve();
          });
        });
      }

      app.render = function(){
        app.view.render();
      }

      app.checkout = function(){
        this.order = new Order;
        this.order.fetch().then(function(){
          new CheckoutView().render();
        });
      }

      app.add = function(name, price){
        this.order.add(name, price);
      }

      // var Router = Backbone.Router.extend({
      //   routes: {
      //     "checkout" : "showCheckout",
      //     "" : "showOrder",
      //   },
      //   showOrder: function(){
      //     app.init();
      //   },
      //   showCheckout: function(){
      //     app.checkout();
      //   }
      // });
      //
      // app.router = new Router();
      // // Backbone.history.start({pushState: true});
      //
      // Backbone.history.start();
    }
  });
}
