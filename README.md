# Picapica visualization

Visualization of a text and its text reuse sources.

## Getting Started

Download the [production version][min] or the [development version][max].

[min]: comming soon
[max]: comming soon

In your web page:

```html
<script src="jquery.js"></script>
<script src="dist/jquery.picaviz.min.js"></script>
<script>
jQuery(function($) {
  $('.container').picaviz(model, options);
});
</script>
```

## Documentation

### Model
The model has to look like this:

```Javascript

[
  {
    active: true|false,
    groupId: String,
    source:{
      id: String,
      title: String,
      start: Number,
      end: Number
    }
    passage:{
      start: Number,
      end: Number
    }
  },
  ...
]

```

Parsed array for drawing
```Javascript
[
  {
    source: source object,
    posSource : Number
  }
]

## Examples
_(Coming soon)_

## Release History
_(Nothing yet)_
