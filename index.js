// import dependencies 
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');

// set up  DB connection and connect to the database
mongoose.connect('mongodb://127.0.0.1:27017/temisConerStore', {
    keepAlive: true,                                            //test code
    useNewUrlParser: true,
    useUnifiedTopology: true
})

// defining the collection where curly braces contain objects
const Order = mongoose.model('shop', {
    name: String,
    email: String,
    phone: String,
    deliveryAddress: String,
    Province: String,
    product1: String,
    product2: String,
    product3: String,
    shippingCost: String,
    subTotal: String,
    deliveryTime: String,
    total: String
});

// set up variables to use packages
var myApp = express();
myApp.use(express.urlencoded({ extended: false }));

// set path to public folders and view folders
myApp.set('views', path.join(__dirname, 'views'));
myApp.use(express.static(__dirname + '/public'));
myApp.set('view engine', 'ejs');


//function to check using the regular expression
function checkRegex(userInput, regex) {
    if (regex.test(userInput)) {
        return userInput;
    }
}

var postCodeRegex = /^[A-Z][0-9][A-Z]\s[0-9][A-Z][0-9]$/;
var phoneRegex = /^\d{3}\s\d{3}\s\d{4}$/;
// -----------Validation Functions----------------

//custom phone validation function 
function customPhoneValidation(value) {
    if (!checkRegex(value, phoneRegex)) {
        throw new Error('Phone should be in the format of 000 000 0000');
    }
    return true;
}

function customPostCode(value) {
    if (!checkRegex(value, postCodeRegex)) {
        throw new Error('Your Post Code should match A1A 1A1');
    }
    return true;
}


// render the home page
myApp.get('/', function(req, res) {
    res.render('shop');
});

myApp.post('/process', [
    check('name', 'Please enter a valid name').notEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
    check('phone', 'Please Enter a valid Phone Number').custom(customPhoneValidation),
    check('address', 'Please enter an address').notEmpty(),
    check('city', 'Please enter a city').notEmpty(),
    check('postCode', '').custom(customPostCode),
    check('province', 'Please select a city').notEmpty(),
    check('product1', 'Please enter a price for product 1').notEmpty(),
    check('product2', 'Please enter a price for product 2').notEmpty(),
    check('product3', 'Please enter a price for product 3').notEmpty(),
    check('deliveryTime', 'Please select preferred delivery time').notEmpty()
], function(req, res) {
    let errors;
    errors = validationResult(req);
    console.log(errors);

    //declaring constants to be used in calculation
    const PRODUCT1 = 10;
    const PRODUCT2 = 20;
    const PRODUCT3 = 30;

    if (errors.isEmpty()) {
        var name = req.body.name;
        var email = req.body.email;
        var phone = req.body.phone;
        var address = req.body.address;
        var city = req.body.city;
        var postCode = req.body.postCode;
        var product1 = parseInt(req.body.product1);
        var product2 = parseInt(req.body.product2);
        var product3 = parseInt(req.body.product3);


        var Province;
        var province = req.body.province;

        switch (province) {
            case '1':
                province = 0.05;
                Province = 'Alberta';
                break;
            case '2':
                province = 0.12;
                Province = 'British Columbia';
                break;
            case '3':
                province = 0.12;
                Province = 'Manitoba';
                break;
            case '4':
                province = 0.15;
                Province = 'New Brunswick';
                break;
            case '5':
                province = 0.15;
                Province = 'Newfoundland & Labrador';
                break;
            case '6':
                province = 0.05;
                Province = 'Northwest Territories';
                break;
            case '7':
                province = 0.15;
                Province = 'Nova Scotia';
                break;
            case '8':
                province = 0.05;
                Province = 'Nunavut';
                break;
            case '9':
                province = 0.13;
                Province = 'Ontario';
                break;
            case '10':
                province = 0.15;
                Province = 'Prince Edward Island';
                break;
            case '11':
                province = 0.14975;
                Province = 'Quebec';
                break;
            case '12':
                province = 0.11;
                Province = 'Saskatchewan';
                break;
            case '13':
                province = 0.05;
                Province = 'Yukon';
        }
        var tax = province;

        var _deliveryTime;
        var deliveryTime = req.body.deliveryTime;
        switch (deliveryTime) {
            case '1':
                deliveryTime = 35;
                _deliveryTime = '1 Day';
                break;
            case '2':
                deliveryTime = 30;
                _deliveryTime = '2 Days';
                break;
            case '3':
                deliveryTime = 20;
                _deliveryTime = '3 Days';
                break;
            case '4':
                deliveryTime = 0;
                _deliveryTime = 'Free Shipping';
                break;
        }
        var shippingCost = deliveryTime;

        product1 = product1 * PRODUCT1;
        product2 = product2 * PRODUCT2;
        product3 = product3 * PRODUCT3;

        var productCost = product1 + product2 + product3;
        var subTotal = productCost + shippingCost;
        tax = subTotal * tax;

        var total = subTotal + tax;

        // New variable to convert province value back to percentage
        var taxPerProvince = province * 100;


        // creating an array object with the fetched data to send to the view
        var receipt = {
            name: name,
            email: email,
            phone: phone,
            deliveryAddress: address + ' ' + city + ' ' + postCode,
            Province: Province + ' @ ' + taxPerProvince + '%',
            product1: product1,
            product2: product2,
            product3: product3,
            shippingCost: shippingCost,
            subTotal: subTotal,
            deliveryTime: _deliveryTime,
            total: total
        }

        console.log(receipt);
        //save the data to the database
        var sale = new Order({
            name: name,
            email: email,
            phone: phone,
            deliveryAddress: address + ' ' + city + ' ' + postCode,
            Province: Province + ' @ ' + taxPerProvince + '%',
            product1: '$' + product1,
            product2: '$' + product2,
            product3: '$' + product3,
            shippingCost: '$' + shippingCost,
            subTotal: '$' + subTotal,
            deliveryTime: _deliveryTime,
            total: '$' + total
        });

        sale.save();
        res.render('shop', receipt);


    } else {
        res.render('shop', {
            errors: errors.array() // stores the errors as an array to be iterated in the home page 
        });
    }
});

// start the server and listen at port 8080... localhost:8080
myApp.listen(8080);

//console message
console.log('Everything executed correctly...website now listening at port 8080......');