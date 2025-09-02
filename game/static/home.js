let darkmode = localStorage.getItem('darkmode')
const themeBtn = document.getElementById('theme-btn')

const enableDarkmode=()=> {
    document.body.classList.add('darkmode')
    localStorage.setItem('darkmode','active')
}

 const disableDarkmode=()=> {
    document.body.classList.remove('darkmode')
    localStorage.setItem('darkmode',null)
}

if (darkmode === "active") enableDarkmode()
themeBtn.addEventListener("click", ()=>{
    darkmode = localStorage.getItem('darkmode')
     darkmode !=="active"? enableDarkmode(): disableDarkmode()
})