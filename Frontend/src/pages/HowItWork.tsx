import Header from '../components/Header'
import Footer from '../components/Footer'
import HowItWorkContent from '../contents/HowItWorkContent'
export default function HowItWork() {
  return (
    <div>
      <Header />
        <div className='how-it-work-page'>
          <HowItWorkContent />          
      </div> <br />
      <Footer />
    </div>
  )
}
