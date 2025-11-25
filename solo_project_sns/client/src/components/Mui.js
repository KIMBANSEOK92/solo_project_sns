import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';

function Mui() {
    return <>
        <Stack spacing={1}>
            <Rating name="size-small" defaultValue={2.5} size="small" />
            <Rating name="half-rating-read" defaultValue={2.5} precision={0.5} readOnly />
        </Stack>



    </>
}



export default Mui;