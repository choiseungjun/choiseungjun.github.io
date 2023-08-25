// Process : 진행중 ▶︎ 검수요청 ▶︎ 검수완료 ▶︎ 개발전달후수정
// 화면 삭제시 배열 4번째에 "삭제" 항목 넣기 : ["화면경로", "(기본빈값)", "프로세스", "(삭제)"],

var res = {
	"Ref" : {
		"작업체크리스트" : ["/guide/checklist_front.html"],
		"관리자 컨텐츠등록 가이드" : ["/guide/checklist_admin.html"],
		"WSG" : {
			"레이아웃" : ["/guide/wsg/guide_layout.html","",""],
			"레이어팝업(full)" : ["/guide/wsg/guide_layer_popup_full.html","",""],
			"바텀시트" : ["/guide/wsg/guide_bottom_sheet.html","",""],
			"바텀시트+네이티브바" : ["/guide/wsg/guide_bottom_sheet2.html","",""],
			"헤더" : ["/guide/wsg/guide_header.html","",""],
			"텍스트" : ["/guide/wsg/guide_text.html","",""],
			"아이콘" : ["/guide/wsg/guide_icon.html","",""],
			"버튼" : ["/guide/wsg/guide_button.html","",""],
			"탭메뉴" : ["/guide/wsg/guide_tab.html","",""],
			"아코디언" : ["/guide/wsg/guide_accordion.html","",""],
			"리스트" : ["/guide/wsg/guide_list.html","",""],
			"라인" : ["/guide/wsg/guide_line.html","",""],
			"폼" : ["/guide/wsg/guide_form.html","",""],
			"약관" : ["/guide/wsg/guide_terms.html","",""],
			"스텝" : ["/guide/wsg/guide_step.html","",""],
			"엘리먼트" : ["/guide/wsg/guide_element.html","",""],
		}
	},
	"Front" : {
		"MY-홈" : {
			"MY3-홈": {
				"MY3-홈": ["/html/MY/MY3.html", "", "검수완료"],
				"MY3.1-내 정보": ["/html/MY/MY3.1.html", "", "검수완료"],
				"MY3.1.1-프로필 수정": ["/html/MY/MY3.1.1.html", "", "검수완료"],
				"MY3.1.1.1-프로필 수정 확인(BS)": ["/html/MY/MY3.1.1.1.html", "", "검수완료"],
				"MY3.1.2-설정": ["/html/MY/MY3.1.2.html", "", "검수완료"],
				"MY3.1.2.1-오픈 소스 라이선스 안내(iOS)(FP)": ["/html/MY/MY3.1.2.1.html", "", "검수완료"],
				"MY3.1.2.7-오픈 소스 라이선스 안내(AOS)(FP)": ["/html/MY/MY3.1.2.7.html", "", "검수완료"],
				"MY3.1.2.2-로그아웃 확인(BS)": ["/html/MY/MY3.1.2.2.html", "", "검수완료"],
				"MY3.1.2.3-회원 탈퇴": ["/html/MY/MY3.1.2.3.html", "", "검수완료"],
				"MY3.1.2.3.1-회원 탈퇴 확인(BS)": ["/html/MY/MY3.1.2.3.1.html", "", "검수완료"],
				"MY3.1.2.3.1.1-회원 탈퇴 완료(BS)": ["/html/MY/MY3.1.2.3.1.1.html", "", "검수완료"],
				"MY3.1.2.4-마케팅 수신 동의 설정 변경 안내(BS)": ["/html/MY/MY3.1.2.4.html", "", "검수완료"],
				"MY3.1.2.5-위치기반 서비스 이용 동의 설정 변경 안내(BS)": ["/html/MY/MY3.1.2.5.html", "", "검수완료"],
				"MY3.1.2.6-푸시 알림 설정 변경 안내(BS)": ["/html/MY/MY3.1.2.6.html", "", "검수완료"],
				"MY3.1.2.8-무료 참가권 목록": ["/html/MY/MY3.1.2.8.html", "", "검수완료"],
				"MY3.1.2.8.1-무료 참가권 등록완료(BS)": ["/html/MY/MY3.1.2.8.1.html", "", "검수완료"],
				"MY3.1.3-전체 기록 보기": ["/html/MY/MY3.1.3.html", "", "검수완료"],
				"MY3.1.3.1-전체 대회 기록 보기": ["/html/MY/MY3.1.3.1.html", "", "검수완료"],
				"MY3.1.7-대회 참여 기록 제출하기(FP)": ["/html/MY/MY3.1.7.html", "", "검수완료"],
				"MY3.2-알림 내용": ["/html/MY/MY3.2.html", "", "검수완료"],
			},
		},
		"ME-회원" : {
			"ME1-로그인": {
				"ME1-로그인": ["/html/ME/ME1.html", "", "검수완료"],
				"ME1.1-비밀번호 재설정 정보 입력": ["/html/ME/ME1.1.html", "", "검수완료"],
				"ME1.2-비밀번호 재설정 이메일 전송 안내": ["/html/ME/ME1.2.html", "", "검수완료"],
				"ME1.3-비밀번호 재설정": ["/html/ME/ME1.3.html", "", "검수완료"],
				"ME1.4-비밀번호 재설정 완료": ["/html/ME/ME1.4.html", "", "검수완료"],
			},
			"ME2-회원가입": {
				"ME2-회원가입": ["/html/ME/ME2.html", "", "검수완료"],
				"ME2.1-이메일/비밀번호로 가입": ["/html/ME/ME2.1.html", "", "검수완료"],
				"ME2.2.1-서비스 이용약관(필수)(FP)": ["/html/ME/ME2.2.1.html", "", "검수완료"],
				"ME2.2.2-개인정보 처리방침(필수)(FP)": ["/html/ME/ME2.2.2.html", "", "검수완료"],
				"ME2.2.3-위치 정보 수집 및 활용 동의(선택)(FP)": ["/html/ME/ME2.2.3.html", "", "검수완료"],
				"ME2.2.4-마케팅 정보 수신 및 활용 동의(선택)(FP)": ["/html/ME/ME2.2.4.html", "", "검수완료"],
				"ME2.3-추가정보 입력, 약관동의": ["/html/ME/ME2.3.html", "", "검수완료"],
				"ME2.4-가입완료": ["/html/ME/ME2.4.html", "", "검수완료"],
			},
		},
		"RA-레이스" : {
			"RA1-대회 목록": {
				"RA1-대회 목록": ["/html/RA/RA1.html", "", "검수완료"],
			},
			"RA2-대회 소개": {
				"RA2-대회 소개": ["/html/RA/RA2.html", "", "검수완료"],
				"RA2.2.1-사이즈 조견표(FP)": ["/html/RA/RA2.2.1.html", "", "검수완료"],
				"RA2.2.2-상세 이미지 보기(FP)": ["/html/RA/RA2.2.2.html", "", "검수완료"],
				"RA2.3.1-공지 상세 보기(FP)": ["/html/RA/RA2.3.1.html", "", "검수완료"],
				"RA2.3.2-FAQ 상세 보기(FP)": ["/html/RA/RA2.3.2.html", "", "검수완료"],
				"RA2.3.3-1:1 문의 작성(FP)": ["/html/RA/RA2.3.3.html", "", "검수완료"],
				"RA2.3.3.1-1:1 문의 작성 완료(BS)": ["/html/RA/RA2.3.3.1.html", "", "검수완료"],
			},
			"RA3-참가 신청": {
				"RA3-참가 신청-1단계: 약관 동의": ["/html/RA/RA3.html", "", "검수완료"],
				"RA3.1-참가신청-2단계: 개인정보 입력": ["/html/RA/RA3.1.html", "", "검수완료"],
				"RA3.1.1-참여연령아님(BS)": ["/html/RA/RA3.1.1.html", "", "검수완료"],
				"RA3.2-참가신청-3단계: 대회 정보 입력": ["/html/RA/RA3.2.html", "", "검수완료"],
				"RA3.3-참가신청-4단계: 보험 가입": ["/html/RA/RA3.3.html", "", "검수완료"],
				"RA3.4-참가신청-5단계: 결제 정보 입력": ["/html/RA/RA3.4.html", "", "검수완료"],
				"RA3.5-참가신청-6단계: 입력 정보 최종 확인": ["/html/RA/RA3.5.html", "", "검수완료"],
				"RA3.6-참가 신청 완료": ["/html/RA/RA3.6.html", "", "검수완료"],
				"RA3.6_2-참가 신청 완료(개발용)": ["/html/RA/RA3.6_2.html", "", "검수완료"],
			},
			"RA4-참가 신청 조회": {
				"RA4-참가 신청 조회": ["/html/RA/RA4.html", "", "검수완료"],
				"RA4_2-참가 신청 조회 수정불가(개발용)": ["/html/RA/RA4_2.html", "", "검수완료"],
				"RA4.2-기념품 사이즈 수정(BS)": ["/html/RA/RA4.2.html", "", "검수완료"],
				"RA4.3-참가 신청 공유(FP)": ["/html/RA/RA4.3.html", "", "검수완료"],
				"RA4.4-참가 신청 취소 확인(BS)": ["/html/RA/RA4.4.html", "", "검수완료"],
				"RA4.5-참가 신청 취소 완료(BS)": ["/html/RA/RA4.5.html", "", "검수완료"],
			},
		},
		"TR-트래커" : {
			"TR1-메인": {
				"TR1-coming soon": ["/html/TR/TR1.html", "", "검수완료"],
				"TR1.1-트래커 메인": ["/html/TR/TR1.1.html", "", "검수완료"],
				"TR1.1.1-위치 정보 수집 및 활용 동의(BS)": ["/html/TR/TR1.1.1.html", "", "검수완료"],
				"TR1.1.2-위치 서비스 설정 안내(BS)": ["/html/TR/TR1.1.2.html", "", "검수완료"],
				"TR1.1.3-트레이닝 시작 알림(BS)": ["/html/TR/TR1.1.3.html", "", "검수완료"],
			},
			"TR2-베타테스트": {
				"TR2-베타 테스트 의견 접수(FP)": ["/html/TR/TR2.html", "", "검수완료"],
				"TR2.1-베타 테스트 의견 접수 완료(BS)": ["/html/TR/TR2.1.html", "", "검수완료"],
			},
		},
		"CO-공통" : {
			"CO2-오류": {
				"CO2.5-웹페이지 에러": ["/html/CO/CO2.5.html", "", "검수완료"],
				"CO2.5_2-결제페이지 에러(개발용)": ["/html/CO/CO2.5_2.html", "", "검수완료"],
			},
			"CO3-이메일 폼": {
				"CO3-이메일 컨펌": ["/html/CO/CO3.html", "", "검수완료"],
				"CO3.1-회원가입 완료": ["/html/CO/CO3.1.html", "", "검수완료"],
				"CO3.2-비밀번호 재설정": ["/html/CO/CO3.2.html", "", "검수완료"],
				"CO3.6-관리자 - 승인요청": ["/html/CO/CO3.6.html", "", "검수완료"],
				"CO3.7-관리자 - 승인완료": ["/html/CO/CO3.7.html", "", "검수완료"],
				"CO3.8-관리자 - 비번재설정": ["/html/CO/CO3.8.html", "", "검수완료"],
				"CO3.9-1:1 문의 답변": ["/html/CO/CO3.9.html", "", "검수완료"],
			},
		},
		"Admin" : {
			"SS00000020_엘르런": {
				"admin001_2-약관-개인정보 처리방침 및 소비자 권익보호 관련 사항": ["/html/admin/admin001_2.html", "", "검수완료"],
				"admin001_4-약관-개인 정보 수집 안내사항": ["/html/admin/admin001_4.html", "", "검수완료"],
				"admin001_5-약관-참가자 정보 수집 및 접수 변경, 취소 안내": ["/html/admin/admin001_5.html", "", "검수완료"],
				"admin001_6-약관-보험 관련 안내사항": ["/html/admin/admin001_6.html", "", "검수완료"],
				"admin001_7-대회홍보": ["/html/admin/admin001_7.html", "", "검수완료"],
			},
			"SS00000021_룰루레몬": {
				"admin001_8-대회홍보": ["/html/admin/admin001_8.html", "", "검수완료"],
			},
			"SS00000022_JTBCPLUS": {
				"admin002_1-대회홍보-JTBCPLUS": ["/html/admin/admin002_1.html", "", "검수완료"],
			},
			"SS00000023_엘르런_v2": {
				"admin003_1-대회홍보": ["/html/admin/admin003_1.html", "", "검수완료"],
			},
			"SS00000024_룰루레몬_v2": {
				"admin004_1-대회홍보": ["/html/admin/admin004_1.html", "", "검수완료"],
			},
		},
	},
};