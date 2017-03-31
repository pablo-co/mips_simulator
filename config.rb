page '/*.xml', layout: false
page '/*.json', layout: false
page '/*.txt', layout: false

activate :autoprefixer do |prefix|
  prefix.browsers = "last 2 versions"
end

activate :sprockets

configure :development do
  activate :livereload
end

configure :build do
  activate :minify_css
  activate :minify_javascript
  activate :minify_html
end

set :build_dir, 'tmp'
