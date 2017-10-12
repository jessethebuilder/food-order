function AnysoftCart(){
  var app = this;

  var OrderItem = Backbone.Model.extend({
    defaults: {
      name: null,
      price: null,
      quantity: 1
    },
    collection: OrderItems,
  });

  var OrderItems = Backbone.Collection.extend({
    model: OrderItem
  });

  var Order = Backbone.Model.extend({
    defaults: {
      items: new OrderItems
    },
    initialize: function(){
      // this.items = new OrderItems
    },
    localStorage: new Backbone.LocalStorage('anysoft_cart_order_storage'),
    // complete: function(){
    //   this.sync({
    //     ajaxSync: true
    //   });
    // }

  });


  var OrderItemsView = Backbone.View.extend({
    collection: OrderItems,
    className: 'order_item_list',
    initialize: function(){
      this.listenTo(this.collection, 'add', this.add);
    },
    add: function(order_item){
      var view = new OrderItemView({model: order_item});
      this.$el.append(view.render().$el);
    },
    render: function(){

      this.collection.each(function(order_item){
        this.add(order_item);
      }, this);

      return this;
    }
  });

  var OrderItemView = Backbone.View.extend({
    model: OrderItem,
    template: _.template($('#anysoft_cart_order_item_template').html()),
    events: {
      'click .delete': 'delete'
    },
    delete: function(){

    },
    render: function(){
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    }
  });

  var OrderView = Backbone.View.extend({
    model: Order,
    el: '#anysoft_cart_order',
    render: function(){
      this.$el.empty();
      var view = new OrderItemsView({collection: this.model.get('items')}).render().$el;
      this.$el.html(view);
      return this;
    }
  });

  this.add = function(name, price, quantity){
    if(typeof quantity === 'undefined'){ quantity = 1; }
    this.order.get('items').add([{name: name, price: price, quantity: quantity}]);
    console.log(this.order);
    this.order.sync();
  }

  this.init = function(){
    const t = this;
    this.order = new Order;

    return new Promise(function(res, rej){
      t.order.fetch().then(function(){
        new OrderView({model: t.order}).render();
        res();
      });
    });
  }
}
