function AnysoftCart(products, opts){
  if(typeof opts == 'undefined'){ opts = {}; }
  // Products are meant to be bootstrapped onto the page, so they can be served
  // from any soruce, though they can be passed to this constructor in any other way.
  var app = this;
  app.product_data = products;
  app.order_endpoint = opts['order_endpoint'] || '/orders';
//--- Orders and OrderItems ----------------------------------------------------------------------

  var OrderItem = Backbone.Model.extend({
    defaults: {
      name: null,
      quantity: null,
      price: null,
      addons: []
    }
  });

  var Order = Backbone.Collection.extend({
    model: OrderItem,
    localStorage: new Backbone.LocalStorage('order_app_storage'),
    url: app.order_endpoint,
    complete: function(){
      this.sync({
        ajaxSync: true
      });
    },
    total: function(){
      var total = 0;
      this.each(function(oi){
        total += oi.get('price') * oi.get('quantity');
      });

      return total;
    },
  });

  var OrderItemView = Backbone.View.extend({
    model: OrderItem,
    template: _.template($('#anysoft_cart_order_item_template').html()),
    events: {
      'click .remove_from_cart': 'removeFromCart',
      'change .quantity': 'updateOrderItemQuantity'
    },
    initialize: function(){
        this.listenTo(this.model, 'destroy', this.remove);
    },
    removeFromCart: function(){
      this.model.destroy();
    },
    updateOrderItemQuantity: function(e){
      var quantity = $(e.target).val();
      if(quantity > 0){
        this.model.set({quantity: quantity}).save();
        this.$el.html(this.template(this.model.toJSON()));
      } else {
        // If quantity is 0 (or less)
        this.removeFromCart();
      }
    },
    render: function(){
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    }
  });

  var OrderView = Backbone.View.extend({
    collection: Order,
    el: $('#anysoft_cart_order'),
    template: _.template($('#anysoft_cart_order_template').html()),
    initialize: function(){
      _.bindAll(this, 'addOrderItem');
      _.bindAll(this, 'updateOrder');

      app.order.listenTo(app.order, 'add', this.addOrderItem);
      app.order.listenTo(app.order, 'all', this.updateOrder);
    },
    addOrderItem: function(order_item){
      var view = new OrderItemView({model: order_item});
      this.$el.find('.order_item_list').append(view.render().$el);
    },
    updateOrder: function(){
      this.init();
    },
    init: function(){
      this.$el.find('.order_total').text(this.collection.total().toFixed(2));
      this.$el.find('.order_item_count').text(this.collection.length);
      // show/hide the order, depending on whether there is any OrderItems
      this.collection.length > 0 ? this.$el.show() : this.$el.hide();
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
      this.collection.each(function(order_item){
        var view = new OrderItemView({model: order_item});
        list.append(view.render().$el);
      });

      this.init();
      return this;
    }
  }); // end OrderView

  //--- Products --------------------------------------------------------------------

  var Product = Backbone.Model.extend({
    defaults: {
      name: null,
      price: null,
      description: null,
      // Addon and current_price (which is set by addons), is stored on the
      // Product model. These are reset whenever an order_item is creatd
      addons: [],
      current_price: null
    },
    initialize: function(){
      this.set('current_price', this.get('price'));
    }
  });

  var Products = Backbone.Collection.extend({
    model: Product,
    initialize: function(){
      // app.products.reset();
    }
  });

  var ProductView = Backbone.View.extend({
    // Expects the page to define this template
    template: _.template($('#anysoft_cart_product_template').html()),
    events: {
      "click .add_to_cart": "addToCart"
    },
    initialize: function(){
      this.listenTo(this.model, 'change:current_price', this.updateAddons);
    },
    updateAddons: function(){
// console.log(this.model.get('current_price'));
      this.$el.find('.current_price').text(this.model.get('current_price'));
    },
    addToCart: function(){
      // Looks for an element with the quantity class. If none is found, assume 1
      var q = this.$el.find('.quantity').val() || 1;
      var oi = new OrderItem({name: this.model.get('name'), price: this.model.get('price'), quantity: q, product_id: this.model.get('id')});
      app.order.add(oi);
      oi.save();
    },
    render: function(){
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    }
  });

  var ProductsView = Backbone.View.extend({
    collection: Products,
    el: $('#anysoft_cart_products'),

    render: function(){
      const t = this;
      this.$el.empty();
      this.collection.each(function(model){
        var view = new ProductView({model: model});
        this.$el.append(view.render().$el);

        var addons = model.get('addons');
        $.each(addons, function(i, a){
          a['product_cid'] = model.cid;
          var addon = new Addon(a);
          var addon_view = new AddonView({model: addon});
          view.$el.find('.addons').append(addon_view.render().$el);
        });
      }, this);

      return this;
    }
  });

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

  this.initProducts = function(){
    this.products = new Products(this.product_data);
    new ProductsView({collection: this.products}).render();
  }

  this.init = function(){
    const t = this;
    this.initProducts();

    t.order = new Order;
    t.order.fetch().then(function(){
      new OrderView({collection: t.order}).render();
    });
  }

  // this.checkout = function(){
  //   this.initProducts();
  //   this.order = new Order;
  //   this.order.fetch().then(function(){
  //     new CheckoutView().render();
  //   });
  // }
  //
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
  // this.router = new Router();
  // // Backbone.history.start({pushState: true});
  //
  // Backbone.history.start();
}
