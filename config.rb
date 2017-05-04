page '/*.xml', layout: false
page '/*.json', layout: false
page '/*.txt', layout: false

require 'bootstrap-sass'

activate :autoprefixer do |prefix|
  prefix.browsers = "last 2 versions"
end

activate :sprockets

configure :development do
  #activate :livereload
end

configure :build do
  activate :minify_css
  activate :directory_indexes
  activate :asset_hash
  activate :minify_javascript
end

set :build_dir, 'build'
