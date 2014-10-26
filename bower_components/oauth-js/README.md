OAuth.io JavaScript SDK
=======================

This is the JavaScript SDK for [OAuth.io](https://oauth.io). OAuth.io allows you to integrate **100+ providers** really easily in your web app, without worrying about each provider's OAuth specific implementation.

Installation
============

Getting the SDK
---------------

To get the SDK, you can :

- download the zip file from this repository
- get it via Bower

**Zip file**

Just copy the dist/oauth.js or dist/oauth.min.js to your project.

**Bower**

```sh
$ bower install oauth-js
```

Integrating in your project
---------------------------

In the `<head>` of your HTML, include OAuth.js

`<script src="/path/to/oauth.js"></script>`

In your Javascript, add this line to initialize OAuth.js

`OAuth.initialize('your_app_public_key');`

Usage
=====

To connect your user using facebook, 2 methods:

Mode popup
----------

 ```javascript
//Using popup (option 1)
OAuth.popup('facebook')
.done(function(result) {
  //use result.access_token in your API request 
  //or use result.get|post|put|del|patch|me methods (see below)
})
.fail(function (err) {
  //handle error with err
});
 ```

Mode redirection
----------------

 ```javascript
//Using redirection (option 2)
OAuth.redirect('facebook', "callback/url");
 ```

In callback url :

 ```javascript
OAuth.callback('facebook')
.done(function(result) {
    //use result.access_token in your API request
    //or use result.get|post|put|del|patch|me methods (see below)
})
.fail(function (err) {
    //handle error with err
});
 ```

Making requests
---------------

You can make requests to the provider's API manually with the access token you got from the `popup` or `callback` methods, or use the request methods stored in the `result` object.

**GET Request**

To make a GET request, you have to call the `result.get` method like this :

```javascript
//Let's say the /me endpoint on the provider API returns a JSON object
//with the field "name" containing the name "John Doe"
OAuth.popup(provider)
.done(function(result) {
    result.get('/me')
    .done(function (response) {
        //this will display "John Doe" in the console
        console.log(response.name);
    })
    .fail(function (err) {
        //handle error with err
    });
})
.fail(function (err) {
    //handle error with err
});
```

**POST Request**

To make a POST request, you have to call the `result.post` method like this :

```javascript
//Let's say the /message endpoint on the provider waits for
//a POST request containing the fields "user_id" and "content"
//and returns the field "id" containing the id of the sent message 
OAuth.popup(provider)
.done(function(result) {
    result.post('/message', {
        data: {
            user_id: 93,
            content: 'Hello Mr. 93 !'
        }
    })
    .done(function (response) {
        //this will display the id of the message in the console
        console.log(response.id);
    })
    .fail(function (err) {
        //handle error with err
    });
})
.fail(function (err) {
    //handle error with err
});
```

**PUT Request**

To make a PUT request, you have to call the `result.post` method like this :

```javascript
//Let's say the /profile endpoint on the provider waits for
//a PUT request to update the authenticated user's profile 
//containing the field "name" and returns the field "name" 
//containing the new name
OAuth.popup(provider)
.done(function(result) {
    result.put('/message', {
        data: {
            name: "John Williams Doe III"
        }
    })
    .done(function (response) {
        //this will display the new name in the console
        console.log(response.name);
    })
    .fail(function (err) {
        //handle error with err
    });
})
.fail(function (err) {
    //handle error with err
});
```

**PATCH Request**

To make a PATCH request, you have to call the `result.patch` method like this :

```javascript
//Let's say the /profile endpoint on the provider waits for
//a PATCH request to update the authenticated user's profile 
//containing the field "name" and returns the field "name" 
//containing the new name
OAuth.popup(provider)
.done(function(result) {
    result.patch('/message', {
        data: {
            name: "John Williams Doe III"
        }
    })
    .done(function (response) {
        //this will display the new name in the console
        console.log(response.name);
    })
    .fail(function (err) {
        //handle error with err
    });
})
.fail(function (err) {
    //handle error with err
});
```

**DELETE Request**

To make a DELETE request, you have to call the `result.del` method like this :

```javascript
//Let's say the /picture?id=picture_id endpoint on the provider waits for
//a DELETE request to delete a picture with the id "84"
//and returns true or false depending on the user's rights on the picture
OAuth.popup(provider)
.done(function(result) {
    result.del('/picture?id=84')
    .done(function (response) {
        //this will display true if the user was authorized to delete
        //the picture
        console.log(response);
    })
    .fail(function (err) {
        //handle error with err
    });
})
.fail(function (err) {
    //handle error with err
});
```

**Me() Request**

The `me()` request is an OAuth.io feature that allows you, when the provider is supported, to retrieve a unified object describing the authenticated user. That can be very useful when you need to login a user via several providers, but don't want to handle a different response each time.

To use the `me()` feature, do like the following (the example works for Facebook, Github, Twitter and many other providers in this case) :

```javascript
//provider can be 'facebook', 'twitter', 'github', or any supported
//provider that contain the fields 'firstname' and 'lastname' 
//or an equivalent (e.g. "FirstName" or "first-name")
var provider = 'facebook';

OAuth.popup(provider)
.done(function(result) {
    result.me()
    .done(function (response) {
        console.log('Firstname: ', response.firstname);
        console.log('Lastname: ', response.lastname);
    })
    .fail(function (err) {
        //handle error with err
    });
})
.fail(function (err) {
    //handle error with err
});
```

*Filtering the results*

You can filter the results of the `me()` method by passing an array of fields you need :

```javascript
//...
result.me(['firstname', 'lastname', 'email'/*, ...*/])
//...
```


Contributing
============

You are welcome to fork and make pull requests. We will be happy to review them and include them in the code if they bring nice improvements :)

Testing the SDK
===============

To test the SDK, you first need to install the npm modules `jasmine-node` and `istanbul` (to get the tests coverage) :

```sh
$ sudo npm install -g jasmine-node@2.0.0 istanbul
```

Then you can run the testsuite from the SDK root directory :

```sh
$ jasmine-node --verbose tests/unit/spec
```

Once you've isntalled `istanbul`, you can run the following command to get coverage information :

```sh
$ npm test
```

The coverage report is generated in the `coverage` folder. You can have a nice HTML render of the report in `coverage/lcof-report/index.html`

License
=======

This SDK is published under the Apache2 License.



More information in [oauth.io documentation](http://oauth.io/#/docs)