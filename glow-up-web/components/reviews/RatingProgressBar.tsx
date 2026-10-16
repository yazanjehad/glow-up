type RatingProgressBarProps={
    value:number
}
// RatingProgressBar component to show a progress bar based on a value from 0 to 100
export function RatingProgressBar({value}:RatingProgressBarProps){
const safeValue=Math.min(100, Math.max(0, value));
    return(
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-orange-400" style={{width:`${safeValue}%`}}></div>
        </div>
    )
}