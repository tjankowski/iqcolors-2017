

$('.navigation__handler').on('click', function() {
    const menu = $('.navigation__items');
    TweenLite.to(menu, .5, {
        opacity: 1,
        onStart: function() {
            menu[0].style.display = 'block';
            menu[0].style.visibility = 'visible';
        }
    });
});

$('.navigation__close').on('click', function() {
    const menu = $('.navigation__items');
    TweenLite.to(menu, .5, {
        opacity: 0,
        onComplete: function() {
            menu[0].style.display = 'none';
            menu[0].style.visibility = 'hidden';
        }
    });
});



function renderItemsHTML(items, sum) {
    const itemsHTML = items.map((item) => {
        return `<tr>
                <td valign="top" class="mcnTextContent" style="padding-top: 0;padding-right: 18px;padding-bottom: 9px;padding-left: 18px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;word-break: break-word;color: #202020;font-family: Helvetica;font-size: 16px;line-height: 150%;text-align: left;">
                    <a href="${location.origin}${item.url}">${item.name}</a>
                </td>
                <td valign="top" class="mcnTextContent" style="white-space: nowrap; padding-top: 0;padding-right: 18px;padding-bottom: 9px;padding-left: 18px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;word-break: break-word;color: #202020;font-family: Helvetica;font-size: 16px; line-height: 150%;text-align: left;">
                    ${item.count}
                </td>
                <td valign="top" class="mcnTextContent" style="white-space: nowrap; padding-top: 0;padding-right: 18px;padding-bottom: 9px;padding-left: 18px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;word-break: break-word;color: #202020;font-family: Helvetica;font-size: 16px;line-height: 150%;text-align: right;">
                    ${item.sum}
                </td>
            </tr>`;
    }).join('');
    return `<tbody>${itemsHTML}</tbody>
        <tfoot>
            <tr style="border-top: 1px solid #AAAAAA">
                <td></td>
                <td valign="top" class="mcnTextContent" style="white-space: nowrap; padding: 9px 18px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;word-break: break-word;color: #202020;font-family: Helvetica;font-size: 16px;font-weight: bold;line-height: 150%;text-align: right;">
                    Suma brutto
                </td>
                <td valign="top" class="mcnTextContent" style="white-space: nowrap; padding: 9px 18px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;word-break: break-word;color: #202020;font-family: Helvetica;font-size: 16px;font-weight: bold;line-height: 150%;text-align: right;">
                    ${sum}
                </td>
            </tr>
        </tfoot>`;
};

////////////////////////////
const API = 'https://hooks.zapier.com/hooks/catch/4081057/c4ss13/';

function  sendOrder(order) {

    const items = Object.keys(order.order).map((id) => {
        return {
            ...order.order[id],
            sum: order.prices[id],
        };
    });

    const orderData = {
        customer: order.customer,
        receiver: order.differentReceiver ? order.receiver : order.customer,
        name: order.name,
        phone: order.phone,
        email: order.email,
        sum: order.sum,
        items,
        itemsHTML: renderItemsHTML(items, order.sum),
    };

    return fetch(API, {
        method: "POST",
        mode: "cors",
        body: JSON.stringify(orderData),
    });
}

function cartDefaultData() {
    return {
        order: {},
        customer: {
            name: '',
            address: '',
            zip: '',
            city: '',
            nip: ''
        },
        receiver: {
            name: '',
            address: '',
            zip: '',
            city: '',
        },
        prices: {},
        name: '',
        phone: '',
        email: '',
        differentReceiver: false,
        regulations: false,
        sum: 0,
        dataLoaded: {
            display: 'flex',
        },
        orderCompleted: false,
        orderFailed: false,
    };
}

if(document.getElementById("cart")) {
    new Vue({
        delimiters: ['${', '}'],
        data: function() {
            return cartDefaultData();
        },
        methods: {
            addItem(id) {
                const order = this.order;
                const count = Number(order[id].count) + 1;
                order[id] = {
                    ...order[id],
                    count
            }
            },
            removeItem(id) {
                const order = this.order;
                if (order[id].count > 1) {
                    const count = Number(order[id].count) - 1;
                    order[id] = {
                        ...order[id],
                        count
                }
                }
            },
            cancelItem(id) {
                Vue.delete(this.order, id);
                Vue.delete(this.prices, id);
                localStorage.setItem('order', JSON.stringify(this.order));
            },
            submitOrder() {
                sendOrder(this.$data)
                .then((response) => {
                    if(response.ok) {
                        Object.assign(this.$data, cartDefaultData());
                        this.orderCompleted = true;
                        return;
                    }
                    this.orderFailed = true;
                });
            },
        },
        watch: {
            order: {
                handler(newOrder) {
                    Object.keys(newOrder).forEach((id) => {
                        this.prices[id] = (Number(newOrder[id].count) * Number(newOrder[id].price)).toFixed(2);
                });
                    this.sum = Object.keys(newOrder).reduce(function (value, id) {
                        return (Number(value) + Number(newOrder[id].price) * Number(newOrder[id].count)).toFixed(2)
                    }, 0);

                    localStorage.setItem('order', JSON.stringify(newOrder));
                    console.log(this.$data);
                },
                deep: true
            }
        },
        mounted() {
            if (localStorage.order) {
                try {
                    this.order = JSON.parse(localStorage.order);
                    const order = this.order;
                    this.sum = Object.keys(order).reduce(function (value, id) {
                        return (Number(value) + Number(order[id].price) * Number(order[id].count)).toFixed(2)
                    }, 0);
                    Object.keys(order).forEach(function(id) {
                        this.prices[id] = (Number(order[id].count) * Number(order[id].price)).toFixed(2);
                    });
                } catch (e) {
                    localStorage.removeItem('order');
                }

            }
        },
    }).$mount("#cart");
}

///////////////////////////////////////////////////////////////

if(document.getElementById("filter")) {
    new Vue({
        delimiters: ['${', '}'],
        data: {
            products: [],
            filters: []
        },
        methods: {
            filter(value) {

                const filters = this.filters = _.includes(this.filters, value)? [] : [value];
                if(filters.length > 0) {
                    this.products.filter(function(index) {
                        const categories = $(this).data('categories').split(',');
                        return _.intersection(categories, filters).length != filters.length;
                    }).addClass('hide');
                    this.products.filter(function(index) {
                        const categories = $(this).data('categories').split(',');
                        return _.intersection(categories, filters).length == filters.length;
                    }).removeClass('hide');
                } else {
                    this.products.removeClass('hide');
                }
                const html = document.getElementById('body').innerHTML;
                const productsUrl = window.location.href.slice(0, window.location.href.lastIndexOf('/')+1);
                const url = `${productsUrl}${_.deburr(_.replace(filters.join(','), ' ','-')).toLowerCase()}`;
                window.history.pushState({'html':html,'pageTitle':'title'}, 'title', url);
            }
        },
        mounted() {
            this.products = $('.tiles__link');
            this.filters = [this.$el.getAttribute('data-filter')];
        }
    }).$mount("#filter");
}

///////////////////////////////////////////////////////////////

if(document.getElementById("product")) {
    new Vue({
        delimiters: ['${', '}'],
        data: {
            product: null,
            id: '',
            ordered: false
        },
        methods: {
            order() {
                const order = JSON.parse(localStorage.getItem('order')) || {};
                const { id, name, price, url } = this.$el.dataset;
                const item = order[id] || {id, name, price, url, count: 0, sum: 0};
                item.count += 1;
                order[id] = item;
                this.product = item;
                localStorage.setItem('order', JSON.stringify(order));
                this.ordered = true;
                setTimeout(() => {
                    this.ordered = false;
                }, 500);
            }
        },
        mounted() {
            if (localStorage.order) {
                try {
                    const order = JSON.parse(localStorage.order);
                    this.id = this.$el.getAttribute('data-id');
                    this.product = order[this.id];
                } catch (e) {
                    localStorage.removeItem('order');
                }

            }
        },
    }).$mount("#product");
}

/////////////////////////////////

let selectedImage = 0;
const nextImageHandler = $('.product__image-navigation_next');
const prevImageHandler = $('.product__image-navigation_prev');

const productImages = $('.product__image');

nextImageHandler.on('click', function() {
    if(selectedImage < productImages.length-1) {
        selectedImage += 1;
    }

    animateMove(selectedImage);
});

prevImageHandler.on('click', function() {
    if(selectedImage > 0) {
        selectedImage -= 1;
    }

    animateMove(selectedImage);
});

const animateMove = _.debounce(function(selectedIndex) {
    if(selectedIndex >= 0 && selectedIndex < productImages.length) {
        TweenMax.staggerTo(productImages, .5, {
            cycle: {
                top: function(index) {
                    return `${(index - selectedIndex) * 100}vh`
                }
            },
            // ease: Back.easeInOut.config(0.5)
        });
    }
    if(selectedIndex > 0 && selectedIndex < productImages.length) {
        TweenLite.to([nextImageHandler, prevImageHandler], .5, {
            opacity: '1',
            transform: 'translateY(0)',
            onStart: function() {
                [nextImageHandler, prevImageHandler].forEach(function(el) {
                    el[0].style.display = 'block';
                    el[0].style.visibility = 'visible';
                });
            }
        });
    }
    if(selectedIndex == productImages.length-1) {
        TweenLite.to(nextImageHandler, .5, {
            opacity: '0',
            transform: 'translateY(+4rem)',
            onComplete: function() {
                nextImageHandler[0].style.display = 'none';
                nextImageHandler[0].style.visibility = 'hidden';
            }
        });
    }
    if(selectedIndex == 0) {
        TweenLite.to(prevImageHandler, .5, {
            opacity: '0',
            transform: 'translateY(-4rem)',
            onComplete: function() {
                prevImageHandler[0].style.display = 'none';
                prevImageHandler[0].style.visibility = 'hidden';
            }
        });
    }
}, 300);
