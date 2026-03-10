import metaJson from '../../data/meta.json'

export default function DataFreshnessTag() {
  return (
    <span className="text-xs text-slate-500">
      Data updated from lsd.law{' '}
      <time dateTime={metaJson.data_freshness}>
        {metaJson.data_freshness}
      </time>
    </span>
  )
}
