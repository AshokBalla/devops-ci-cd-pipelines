def call(Map args = [:]) {
  echo "Notifying ${args.channel ?: 'qa-automation'} with status ${args.status ?: 'SUCCESS'}"
}
